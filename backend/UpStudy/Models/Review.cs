using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class Review
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public int Rating { get; set; } 
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public string TargetUserId { get; set; } = string.Empty;
    public AppUser TargetUser { get; set; } = null!;
    
    public string AuthorId { get; set; } = string.Empty;
}