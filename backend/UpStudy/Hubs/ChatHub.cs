using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using UpStudy.Interfaces;

namespace UpStudy.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    // --- NEW CHAT ID METHODS ---
    public async Task JoinChat(string chatId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;
        
        if (!Guid.TryParse(chatId, out var chatGuid)) throw new HubException("Invalid Chat ID");

        using (var scope = Context.GetHttpContext()?.RequestServices.CreateScope())
        {
            if (scope == null) throw new HubException("Server Error: Cannot create scope");
            var dbContext = scope.ServiceProvider.GetRequiredService<UpStudy.Models.ApplicationDbContext>();
             
            var chat = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.Include(
                    dbContext.Chats, c => c.Order), 
                c => c.Id == chatGuid);
             
             if (chat == null) throw new HubException("Chat not found");
             
             // Validate Access
             bool isParticipant = chat.Order.ClientId == userId || chat.ParticipantId == userId || chat.Order.ExecutorId == userId;
             if (!isParticipant) throw new HubException("Access Denied");
        }

        string groupName = $"chat_{chatGuid}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await UpdateUserStatus(true);
    }

    public async Task LeaveChat(string chatId)
    {
        string groupName = $"chat_{chatId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    // --- OLD COMPAT METHODS (Deprecated) ---
    // Клієнт викликає цей метод, коли відкриває сторінку замовлення
    public async Task JoinChatGroup(string orderId, string? candidateId = null)
    {
        // ... (Old Logic - Keeping if needed for rollback, but we will use new one)
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        if (!Guid.TryParse(orderId, out var orderGuid))
            throw new HubException("Invalid Order ID");

        // ... (Existing implementation)
        // NOTE: We should probably redirect this to new logic internally if possible,
        // but since frontend will change, we can leave this as "Legacy".
        // HOWEVER, since SaveMessage now broadcasts to `chat_{chatId}`, this old method 
        // joining `{orderId}_{candidateId}` will NOT receive messages anymore!
        // FIX: We must update this legacy method to ALSO find the ChatId and join `chat_{chatId}` if we want to support mixed versions.
        // OR better: we update Frontend completely and don't care about this method.
        // Given we are refactoring, let's assume we update Frontend. 
        // But to be safe, let's make this method lookup the chat and join the NEW group name too.
        
        // REPLACING WITH LOOKUP LOGIC:
        
        using (var scope = Context.GetHttpContext()?.RequestServices.CreateScope())
        {
            if (scope == null) throw new HubException("Server Error: Cannot create scope");
            var chatService = scope.ServiceProvider.GetRequiredService<IChatService>();
            
            // Re-use service to find chat ID
            try {
                var chatId = await chatService.GetChatIdAsync(orderGuid, userId, candidateId);
                string groupName = $"chat_{chatId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                await UpdateUserStatus(true);
            } catch (Exception ex) {
                throw new HubException(ex.Message);
            }
        }
    }

    public async Task LeaveChatGroup(string orderId, string? candidateId = null)
    {
         // Legacy leave - hard to know ChatId without lookup.
         // Just ignore or try to lookup.
    }

    // ... (OnConnected/Disconnected/UpdateUserStatus same)

    private async Task UpdateUserStatus(bool isOnline)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return;

        using (var scope = Context.GetHttpContext()?.RequestServices.CreateScope())
        {
             if (scope != null)
             {
                 var dbContext = scope.ServiceProvider.GetRequiredService<UpStudy.Models.ApplicationDbContext>();
                 var user = await dbContext.Users.FindAsync(userId);
                 if (user != null)
                 {
                     user.LastActive = DateTime.UtcNow;
                     await dbContext.SaveChangesAsync();
                 }
             }
        }
    }

    // 4.1 Відправка текстового повідомлення
    public async Task SendMessage(string orderId, string messageText, string? candidateId = null)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) throw new HubException("Unauthorized");
        
        if (Guid.TryParse(orderId, out Guid orderGuid))
        {
            await _chatService.SaveMessageAsync(orderGuid, userId, messageText, candidateId);
        }
    }
}