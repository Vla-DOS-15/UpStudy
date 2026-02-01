namespace UpStudy.Dtos.Chat;

public class ChatPreviewDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderTitle { get; set; } = string.Empty;
    public string InterlocutorId { get; set; } = string.Empty;
    public string InterlocutorName { get; set; } = string.Empty;
    public string? InterlocutorAvatarUrl { get; set; }
    public string LastMessage { get; set; } = string.Empty;
    public DateTime? LastMessageDate { get; set; }
    public int UnreadCount { get; set; }
}
