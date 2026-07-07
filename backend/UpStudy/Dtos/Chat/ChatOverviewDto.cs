namespace UpStudy.Dtos.Chat;

public class ChatOverviewDto
{
    public Guid ChatId { get; set; }
    public Guid OrderId { get; set; }
    public string OrderTitle { get; set; } = string.Empty;
    public string OtherUserName { get; set; } = string.Empty;
    public string? OtherUserAvatar { get; set; }
    public string? LastMessage { get; set; }
    public DateTime? LastMessageTime { get; set; }
    public int UnreadCount { get; set; }
}
