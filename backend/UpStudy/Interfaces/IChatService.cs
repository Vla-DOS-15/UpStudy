using UpStudy.Dtos.Chat;

namespace UpStudy.Interfaces;

public interface IChatService
{
    Task<List<ChatMessageDto>> GetMessagesAsync(Guid orderId, string userId);
    Task<ChatMessageDto> SaveMessageAsync(Guid orderId, string senderId, string text, bool isSystem = false);
    Task<ChatMessageDto> SaveFileMessageAsync(Guid orderId, string senderId, IFormFile file);
    Task SendSystemMessageAsync(Guid orderId, string text); // Для виклику з OrderService
}