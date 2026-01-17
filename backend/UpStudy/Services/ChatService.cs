using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using UpStudy.Dtos;
using UpStudy.Dtos.Chat;
using UpStudy.Hubs;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Services;

public class ChatService : IChatService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<ChatHub> _hubContext; // Тут HubContext ПОТРІБЕН
    private readonly IS3Service _s3Service;
    public ChatService(ApplicationDbContext context, IHubContext<ChatHub> hubContext, IS3Service s3Service)
    {
        _context = context;
        _hubContext = hubContext;
        _s3Service = s3Service;
    }

  public async Task<List<ChatMessageDto>> GetMessagesAsync(Guid orderId, string userId)
    {
        var order = await _context.Orders.Include(o => o.Chat).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        
        bool isParticipant = order.ClientId == userId || order.ExecutorId == userId; 
        
        if (!isParticipant) throw new UnauthorizedAccessException("Ви не маєте доступу до цього чату");

        if (order.Chat == null)
        {
            var newChat = new Chat { OrderId = orderId };
            _context.Chats.Add(newChat);
            await _context.SaveChangesAsync();
            return new List<ChatMessageDto>();
        }

        var messages = await _context.ChatMessages
            .Where(m => m.ChatId == order.Chat.Id)
            .Include(m => m.Sender)
            .Include(m => m.Attachments)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        var messageDtos = new List<ChatMessageDto>();

        foreach (var m in messages)
        {
            var attachmentDtos = new List<ChatAttachmentDto>();
            
            // Генеруємо presigned URLs для кожного файлу
            foreach (var a in m.Attachments)
            {
                var viewUrl = await _s3Service.GetPresignedViewUrlAsync(a.S3Key, expirationMinutes: 60);
                var downloadUrl = await _s3Service.GetPresignedDownloadUrlAsync(a.S3Key, expirationMinutes: 60);
                
                attachmentDtos.Add(new ChatAttachmentDto
                {
                    Id = a.Id,
                    OriginalFileName = a.OriginalFileName,
                    ViewUrl = viewUrl,         // Для перегляду в браузері
                    DownloadUrl = downloadUrl  // Для завантаження
                });
            }

            messageDtos.Add(new ChatMessageDto
            {
                Id = m.Id,
                Text = m.Text,
                SentAt = m.SentAt,
                IsSystem = m.IsSystem,
                SenderId = m.SenderId,
                SenderName = m.IsSystem ? "СИСТЕМА" : $"{m.Sender.FirstName} {m.Sender.LastName}",
                Attachments = attachmentDtos
            });
        }

        return messageDtos;
    }

    // Єдиний метод для збереження і розсилки тексту
    public async Task<ChatMessageDto> SaveMessageAsync(Guid orderId, string senderId, string text, bool isSystem = false)
    {
        var chat = await GetOrCreateChatAsync(orderId);

        var message = new ChatMessage
        {
            ChatId = chat.Id,
            SenderId = senderId,
            Text = text,
            IsSystem = isSystem,
            SentAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        if (!isSystem) await _context.Entry(message).Reference(m => m.Sender).LoadAsync();

        var dto = new ChatMessageDto
        {
            Id = message.Id,
            Text = message.Text,
            SentAt = message.SentAt,
            IsSystem = message.IsSystem,
            SenderId = senderId,
            SenderName = isSystem ? "СИСТЕМА" : $"{message.Sender.FirstName} {message.Sender.LastName}",
            Attachments = new List<ChatAttachmentDto>()
        };

        // --- ЦЕНТРАЛІЗОВАНА РОЗСИЛКА ---
        // Відправляємо всім підключеним клієнтам (включно з тим, хто відправив, якщо він слухає сокет)
        await _hubContext.Clients.Group(orderId.ToString()).SendAsync("ReceiveMessage", dto);
        
        return dto;
    }

    // Метод для файлів (теж з розсилкою)
    public async Task<ChatMessageDto> SaveFileMessageAsync(Guid orderId, string senderId, IFormFile file)
    {
        var chat = await GetOrCreateChatAsync(orderId);
        
        // Завантажуємо файл в S3 (папка "chat-files")
        var s3Key = await _s3Service.UploadFileAsync(file, "chat-files");

        var message = new ChatMessage 
        { 
            ChatId = chat.Id, 
            SenderId = senderId, 
            Text = string.Empty, 
            SentAt = DateTime.UtcNow 
        };
        
        var attachment = new ChatAttachment 
        { 
            ChatMessage = message, 
            OriginalFileName = file.FileName, 
            S3Key = s3Key  // Зберігаємо S3 ключ
        };

        _context.ChatMessages.Add(message);
        _context.ChatAttachments.Add(attachment);
        await _context.SaveChangesAsync();
        await _context.Entry(message).Reference(m => m.Sender).LoadAsync();

        // Генеруємо presigned URLs
        var viewUrl = await _s3Service.GetPresignedViewUrlAsync(s3Key);
        var downloadUrl = await _s3Service.GetPresignedDownloadUrlAsync(s3Key);

        var dto = new ChatMessageDto
        {
            Id = message.Id, 
            Text = "", 
            SentAt = message.SentAt, 
            SenderId = senderId,
            SenderName = $"{message.Sender.FirstName} {message.Sender.LastName}",
            Attachments = new List<ChatAttachmentDto> 
            { 
                new ChatAttachmentDto 
                { 
                    Id = attachment.Id, 
                    OriginalFileName = attachment.OriginalFileName,
                    ViewUrl = viewUrl,
                    DownloadUrl = downloadUrl
                } 
            }
        };

        await _hubContext.Clients.Group(orderId.ToString()).SendAsync("ReceiveMessage", dto);
        return dto;
    }
    
    // ... (SendSystemMessageAsync та Helper GetOrCreateChatAsync без змін) ...
    public async Task SendSystemMessageAsync(Guid orderId, string text)
    {
         var order = await _context.Orders.FindAsync(orderId);
         if (order == null) return;
         // Цей метод всередині викликає SaveMessageAsync, який вже містить розсилку!
         // Тому тут вручну викликати _hubContext НЕ ТРЕБА.
         await SaveMessageAsync(orderId, order.ClientId, text, isSystem: true);
    }

    private async Task<Chat> GetOrCreateChatAsync(Guid orderId)
    {
        var chat = await _context.Chats.FirstOrDefaultAsync(c => c.OrderId == orderId);
        if (chat == null) {
            chat = new Chat { OrderId = orderId };
            _context.Chats.Add(chat);
            await _context.SaveChangesAsync();
        }
        return chat;
    }
}