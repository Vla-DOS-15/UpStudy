using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class ChatMessage
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Text { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    
    public bool IsSystem { get; set; } = false;
 

    public string SenderId { get; set; } = string.Empty;
    public AppUser Sender { get; set; } = null!;

    public Guid ChatId { get; set; }
    public Chat Chat { get; set; } = null!;

    // Список файлів, прикріплених до одного повідомлення
    public List<ChatAttachment> Attachments { get; set; } = new();
}