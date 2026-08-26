using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UpStudy.Models;

public class UserCertificate
{
    public int Id { get; set; }
    
    [Required]
    public string AppUserId { get; set; } = string.Empty;
    [ForeignKey("AppUserId")]
    public AppUser AppUser { get; set; } = null!;
    
    public string Name { get; set; } = string.Empty;
    
    public int StartMonth { get; set; }
    public int StartYear { get; set; }
    public int EndMonth { get; set; }
    public int EndYear { get; set; }
    
    public string? Url { get; set; }
}
