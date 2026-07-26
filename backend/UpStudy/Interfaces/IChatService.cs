using UpStudy.Dtos.Chat;

namespace UpStudy.Interfaces;

public interface IChatService
{
    Task<Guid> GetChatIdAsync(Guid orderId, string userId, string? candidateId = null);
    Task<List<ChatMessageDto>> GetMessagesByChatIdAsync(Guid chatId, string userId);
    Task<List<ChatMessageDto>> GetMessagesAsync(Guid orderId, string userId, string? candidateId = null);
    Task<ChatMessageDto> SaveMessageByChatIdAsync(Guid chatId, string senderId, string text, bool isSystem = false);
    Task<ChatMessageDto> SaveFileMessageByChatIdAsync(Guid chatId, string senderId, IFormFile file);
    Task<ChatMessageDto> SaveMessageAsync(Guid orderId, string senderId, string text, string? candidateId = null, bool isSystem = false);
    Task<ChatMessageDto> SaveFileMessageAsync(Guid orderId, string senderId, IFormFile file, string? candidateId = null);
    Task SendSystemMessageAsync(Guid orderId, string text); // Для виклику з OrderService
    Task<DateTime> GetUserLastActiveAsync(string userId);
    Task<List<ChatOverviewDto>> GetUserChatsAsync(string userId);
    Task<int> GetTotalUnreadCountAsync(string userId);
    Task MarkChatAsReadAsync(Guid chatId, string userId);
}