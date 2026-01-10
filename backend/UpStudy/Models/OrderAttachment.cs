using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class OrderAttachment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public string FilePath { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public bool IsResultWork { get; set; } = false; 

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
}