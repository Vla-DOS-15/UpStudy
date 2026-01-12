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

    // Клієнт викликає цей метод, коли відкриває сторінку замовлення
    public async Task JoinChatGroup(string orderId)
    {
        // Тут бажано перевірити права доступу (можна через сервіс), чи може цей Context.UserId зайти в цей orderId
        // Для спрощення просто додаємо в групу
        await Groups.AddToGroupAsync(Context.ConnectionId, orderId);
    }

    public async Task LeaveChatGroup(string orderId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, orderId);
    }

    // 4.1 Відправка текстового повідомлення
    public async Task SendMessage(string orderId, string messageText)
    {
        var userId = Context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (Guid.TryParse(orderId, out Guid orderGuid))
        {
            // Просто викликаємо сервіс, він сам збереже і сам розішле
            await _chatService.SaveMessageAsync(orderGuid, userId, messageText);
        }
    }
}