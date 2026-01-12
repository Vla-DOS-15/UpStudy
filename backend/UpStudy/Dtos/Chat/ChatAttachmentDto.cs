namespace UpStudy.Dtos.Chat;

public class ChatAttachmentDto
{
    public Guid Id { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
}