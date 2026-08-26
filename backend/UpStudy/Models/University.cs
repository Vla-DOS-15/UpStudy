using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class University
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? NameEn { get; set; }
}
