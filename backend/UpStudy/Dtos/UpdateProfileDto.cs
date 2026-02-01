using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class UpdateProfileDto
{
    [Required]
    public string UserName { get; set; } = string.Empty;
    
    [Required]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    public string LastName { get; set; } = string.Empty;
    
    public string? PhoneNumber { get; set; }
    
    public string? BankCardNumber { get; set; }
    public string? BankCardOwnerName { get; set; }
}
