using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UpStudy.Models;

public class RefreshTokenInfo
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Token { get; set; } = string.Empty;
    public DateTime Expiry { get; set; }
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    // IP адреса, з якої створили токен (корисно для безпеки, опціонально)
    public string? CreatedByIp { get; set; } 

    public string UserId { get; set; } = string.Empty;
    
    [ForeignKey("UserId")]
    public AppUser User { get; set; } = null!;
}