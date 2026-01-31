using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class Chat
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    
    public string? ParticipantId { get; set; } 
    public AppUser? Participant { get; set; }

    public bool IsManagerJoined { get; set; } = false;

    public List<ChatMessage> Messages { get; set; } = new();
}