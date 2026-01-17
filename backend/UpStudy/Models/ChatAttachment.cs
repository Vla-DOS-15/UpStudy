using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class ChatAttachment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string S3Key { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public Guid ChatMessageId { get; set; }
    public ChatMessage ChatMessage { get; set; } = null!;
}