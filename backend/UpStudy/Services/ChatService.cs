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
    private readonly IR2Service _r2Service;
    public ChatService(ApplicationDbContext context, IHubContext<ChatHub> hubContext, IR2Service r2Service)
    {
        _context = context;
        _hubContext = hubContext;
        _r2Service = r2Service;
    }

    public async Task<Guid> GetChatIdAsync(Guid orderId, string userId, string? candidateId = null)
    {
        var order = await _context.Orders.FindAsync(orderId);
        if (order == null) throw new KeyNotFoundException("Order not found");

        if (order.ClientId == userId)
        {
            if (candidateId == userId) candidateId = null;

            if (string.IsNullOrEmpty(candidateId)) 
            {
                 // If no candidate specified, try to find ANY existing chat for this order?
                 // Or require CandidateId? Let's require it for initial chat creation.
                 // BUT if order has ExecutorId, we can use that.
                 if (order.ExecutorId != null) candidateId = order.ExecutorId;
                 else throw new ArgumentException("CandidateId required for client to start chat");
            }
        }
        else
        {
            // If user is candidate/executor
            candidateId = userId;
        }

        var chat = await GetOrCreateChatAsync(orderId, candidateId);
        return chat.Id;
    }

    public async Task<List<ChatMessageDto>> GetMessagesByChatIdAsync(Guid chatId, string userId)
    {
        var chat = await _context.Chats
            .Include(c => c.Order)
            .Include(c => c.Messages)
                .ThenInclude(m => m.Sender)
            .Include(c => c.Messages)
                .ThenInclude(m => m.Attachments)
            .FirstOrDefaultAsync(c => c.Id == chatId);

        if (chat == null) throw new KeyNotFoundException("Chat not found");

        // Validate access
        bool isParticipant = chat.Order.ClientId == userId || chat.ParticipantId == userId;
        // Also allow if user is the stored participant (even if logic slightly differs) or Executor
        if (!isParticipant && chat.Order.ExecutorId == userId) isParticipant = true;
        
        if (!isParticipant) throw new UnauthorizedAccessException("Access denied");

        return await MapMessagesToDto(chat.Messages);
    }

    public async Task<List<ChatMessageDto>> GetMessagesAsync(Guid orderId, string userId, string? candidateId = null)
    {
        // ... (Existing implementation delegates to or logic is similar, keeping for backward compat if needed)
        // For now, let's just use the new logic internally if possible or keep as is.
        // To be safe, let's implement validation and fetch logic.
        
        var chatId = await GetChatIdAsync(orderId, userId, candidateId);
        return await GetMessagesByChatIdAsync(chatId, userId);
    }

    private async Task<List<ChatMessageDto>> MapMessagesToDto(IEnumerable<ChatMessage> messages)
    {
        var messageDtos = new List<ChatMessageDto>();
        foreach (var m in messages.OrderBy(x => x.SentAt))
        {
            var attachmentDtos = new List<ChatAttachmentDto>();
            foreach (var a in m.Attachments)
            {
                var viewUrl = await _r2Service.GetPresignedViewUrlAsync(a.S3Key, expirationMinutes: 60);
                var downloadUrl = await _r2Service.GetPresignedDownloadUrlAsync(a.S3Key, expirationMinutes: 60);
                attachmentDtos.Add(new ChatAttachmentDto
                {
                    Id = a.Id,
                    OriginalFileName = a.OriginalFileName,
                    ViewUrl = viewUrl,
                    DownloadUrl = downloadUrl
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
    public async Task<ChatMessageDto> SaveMessageAsync(Guid orderId, string senderId, string text, string? candidateId = null, bool isSystem = false)
    {
        var order = await _context.Orders.FindAsync(orderId);
        if (order == null) throw new KeyNotFoundException("Order not found");

        // Logic to determine chat participant
        if (order.ClientId == senderId)
        {
             // Client must provide candidateId to know which chat to write to
             if (string.IsNullOrEmpty(candidateId)) throw new ArgumentException("CandidateId is required for client messages");
        }
        else
        {
            // If sender is NOT client, assume they are the candidate talking to client
            candidateId = senderId;
        }

        var chat = await GetOrCreateChatAsync(orderId, candidateId);

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
            ChatId = chat.Id,
            Text = message.Text,
            SentAt = message.SentAt,
            IsSystem = message.IsSystem,
            SenderId = senderId,
            SenderName = isSystem ? "СИСТЕМА" : $"{message.Sender.FirstName} {message.Sender.LastName}",
            Attachments = new List<ChatAttachmentDto>()
        };

        // Send to specific group: {orderId}_{candidateId}
        // Exception: If system message to "General Order Group" (if such exists)? 
        // For now, system messages also go to specific chat if candidateId is provided.
        // If candidateId is null (e.g. system broadcast?), we might need to iterate or send to all.
        // Assuming system messages in this context are also 1:1.
        
        string groupName = $"chat_{chat.Id}";
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", dto);
        
        var recipientId = chat.Order.ClientId == senderId ? (chat.ParticipantId ?? chat.Order.ExecutorId) : chat.Order.ClientId;
        if (!string.IsNullOrEmpty(recipientId))
        {
            await _hubContext.Clients.User(recipientId).SendAsync("ReceiveMessage", dto);
        }
        
        return dto;
    }

    // Метод для файлів (теж з розсилкою)
    public async Task<ChatMessageDto> SaveFileMessageAsync(Guid orderId, string senderId, IFormFile file, string? candidateId = null)
    {
        var order = await _context.Orders.FindAsync(orderId);
        if (order == null) throw new KeyNotFoundException();

        if (order.ClientId == senderId)
        {
             if (string.IsNullOrEmpty(candidateId)) throw new ArgumentException("CandidateId required");
        }
        else
        {
            candidateId = senderId;
        }
        
        var chat = await GetOrCreateChatAsync(orderId, candidateId);
        
        var s3Key = await _r2Service.UploadFileAsync(file, "chat-files");

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
            S3Key = s3Key 
        };

        _context.ChatMessages.Add(message);
        _context.ChatAttachments.Add(attachment);
        await _context.SaveChangesAsync();
        await _context.Entry(message).Reference(m => m.Sender).LoadAsync();

        var viewUrl = await _r2Service.GetPresignedViewUrlAsync(s3Key);
        var downloadUrl = await _r2Service.GetPresignedDownloadUrlAsync(s3Key);

        var dto = new ChatMessageDto
        {
            Id = message.Id, 
            ChatId = chat.Id,
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

        string groupName = $"chat_{chat.Id}";
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", dto);
        return dto;
    }
    
    // ... (SendSystemMessageAsync та Helper GetOrCreateChatAsync без змін) ...
    public async Task SendSystemMessageAsync(Guid orderId, string text)
    {
         var order = await _context.Orders.FindAsync(orderId);
         if (order == null) return;
         // В системних повідомленнях ми будемо вважати що вони йдуть в чат виконавця, якщо order.ExecutorId != null
         // Або треба розсилати всім? Поки що, якщо виконавець призначений - пишемо йому.
         // Якщо ні... ну, давайте поки вимагати наявності виконавця для системних повідомлень або слати null, але тоді логіка SaveMessage зламається.
         // FIX: Якщо candidateId = null (загальне повідомлення?), то SaveMessage кине помилку для ClientId==Sender (system?). 
         // Але тут SenderId буде "System"? Ні, ми передаємо order.ClientId як sender.
         
         // Припустимо, системні повідомлення зараз йдуть тільки коли статус замовлення змінюється, а це зазвичай стосується виконавця.
         await SaveMessageAsync(orderId, order.ClientId, text, candidateId: order.ExecutorId, isSystem: true);
    }

    private async Task<Chat> GetOrCreateChatAsync(Guid orderId, string? participantId)
    {
        var chat = await _context.Chats.FirstOrDefaultAsync(c => c.OrderId == orderId && c.ParticipantId == participantId);
        if (chat == null) {
            chat = new Chat { OrderId = orderId, ParticipantId = participantId };
            _context.Chats.Add(chat);
            await _context.SaveChangesAsync();
        }
        return chat;
    }

    public async Task<ChatMessageDto> SaveMessageByChatIdAsync(Guid chatId, string senderId, string text, bool isSystem = false)
    {
        var chat = await _context.Chats.Include(c => c.Order).FirstOrDefaultAsync(c => c.Id == chatId);
        if (chat == null) throw new KeyNotFoundException("Chat not found");

        // Validate Access
        bool isParticipant = chat.Order.ClientId == senderId || chat.ParticipantId == senderId || chat.Order.ExecutorId == senderId || isSystem;
        if (!isParticipant) throw new UnauthorizedAccessException("Access denied");

        var message = new ChatMessage
        {
            ChatId = chatId,
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
            ChatId = chatId,
            Text = message.Text,
            SentAt = message.SentAt,
            IsSystem = message.IsSystem,
            SenderId = senderId,
            SenderName = isSystem ? "СИСТЕМА" : $"{message.Sender.FirstName} {message.Sender.LastName}",
            Attachments = new List<ChatAttachmentDto>()
        };

        string groupName = $"chat_{chatId}";
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", dto);

        var recipientId = chat.Order.ClientId == senderId ? (chat.ParticipantId ?? chat.Order.ExecutorId) : chat.Order.ClientId;
        if (!string.IsNullOrEmpty(recipientId))
        {
            await _hubContext.Clients.User(recipientId).SendAsync("ReceiveMessage", dto);
        }

        return dto;
    }

    public async Task<ChatMessageDto> SaveFileMessageByChatIdAsync(Guid chatId, string senderId, IFormFile file)
    {
        var chat = await _context.Chats.Include(c => c.Order).FirstOrDefaultAsync(c => c.Id == chatId);
        if (chat == null) throw new KeyNotFoundException("Chat not found");

        bool isParticipant = chat.Order.ClientId == senderId || chat.ParticipantId == senderId || chat.Order.ExecutorId == senderId;
        if (!isParticipant) throw new UnauthorizedAccessException("Access denied");
        
        var s3Key = await _r2Service.UploadFileAsync(file, "chat-files");

        var message = new ChatMessage 
        { 
            ChatId = chatId, 
            SenderId = senderId, 
            Text = string.Empty, 
            SentAt = DateTime.UtcNow 
        };
        
        var attachment = new ChatAttachment 
        { 
            ChatMessage = message, 
            OriginalFileName = file.FileName, 
            S3Key = s3Key 
        };

        _context.ChatMessages.Add(message);
        _context.ChatAttachments.Add(attachment);
        await _context.SaveChangesAsync();
        await _context.Entry(message).Reference(m => m.Sender).LoadAsync();

        var viewUrl = await _r2Service.GetPresignedViewUrlAsync(s3Key);
        var downloadUrl = await _r2Service.GetPresignedDownloadUrlAsync(s3Key);

        var dto = new ChatMessageDto
        {
            Id = message.Id, 
            ChatId = chatId,
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

        string groupName = $"chat_{chatId}";
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", dto);

        var recipientId = chat.Order.ClientId == senderId ? (chat.ParticipantId ?? chat.Order.ExecutorId) : chat.Order.ClientId;
        if (!string.IsNullOrEmpty(recipientId))
        {
            await _hubContext.Clients.User(recipientId).SendAsync("ReceiveMessage", dto);
        }

        return dto;
    }

    public async Task<DateTime> GetUserLastActiveAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException("Користувача не знайдено");
        return user.LastActive;
    }

    public async Task<List<ChatOverviewDto>> GetUserChatsAsync(string userId)
    {
        var chats = await _context.Chats
            .Include(c => c.Order)
                .ThenInclude(o => o.Client)
            .Include(c => c.Messages)
            .Where(c => c.Order.ClientId == userId || c.ParticipantId == userId || c.Order.ExecutorId == userId)
            .ToListAsync();

        var overviewList = new List<ChatOverviewDto>();

        foreach (var chat in chats)
        {
            var otherUserId = chat.Order.ClientId == userId 
                ? (chat.ParticipantId ?? chat.Order.ExecutorId)
                : chat.Order.ClientId;

            if (string.IsNullOrEmpty(otherUserId)) continue;

            var otherUser = await _context.Users.FindAsync(otherUserId);
            var lastMessage = chat.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault();
            
            string? avatarUrl = null;
            if (!string.IsNullOrEmpty(otherUser?.AvatarS3Key))
            {
                avatarUrl = await _r2Service.GetPresignedViewUrlAsync(otherUser.AvatarS3Key);
            }

            overviewList.Add(new ChatOverviewDto
            {
                ChatId = chat.Id,
                OrderId = chat.OrderId,
                OrderTitle = chat.Order.Title,
                OtherUserName = otherUser != null ? $"{otherUser.FirstName} {otherUser.LastName}" : "Невідомий",
                OtherUserAvatar = avatarUrl,
                LastMessage = lastMessage?.Text ?? (lastMessage != null && lastMessage.Text == string.Empty ? "Файл" : null),
                LastMessageTime = lastMessage?.SentAt,
                UnreadCount = chat.Messages.Count(m => !m.IsRead && m.SenderId != userId)
            });
        }

        return overviewList.OrderByDescending(c => c.LastMessageTime ?? DateTime.MinValue).ToList();
    }

    public async Task<int> GetTotalUnreadCountAsync(string userId)
    {
        var count = await _context.Chats
            .Where(c => c.Order.ClientId == userId || c.ParticipantId == userId || c.Order.ExecutorId == userId)
            .SelectMany(c => c.Messages)
            .CountAsync(m => !m.IsRead && m.SenderId != userId);

        return count;
    }

    public async Task MarkChatAsReadAsync(Guid chatId, string userId)
    {
        var chat = await _context.Chats
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == chatId && (c.Order.ClientId == userId || c.ParticipantId == userId || c.Order.ExecutorId == userId));

        if (chat != null)
        {
            var unreadMessages = chat.Messages.Where(m => !m.IsRead && m.SenderId != userId).ToList();
            if (unreadMessages.Any())
            {
                foreach (var message in unreadMessages)
                {
                    message.IsRead = true;
                }
                await _context.SaveChangesAsync();
                
                // Сповіщаємо клієнта про оновлення лічильника
                await _hubContext.Clients.User(userId).SendAsync("UnreadCountUpdated");
            }
        }
    }
}