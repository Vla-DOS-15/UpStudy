namespace UpStudy.Dtos.Chat;

public class ChatMessageDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public bool IsSystem { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty; // "Іван Іванов" або "Manager"
    
    // Список файлів
    public List<ChatAttachmentDto> Attachments { get; set; } = new();
}