using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class RegisterDto
{
    [Required]
    public string Role { get; set; } = "Client";

    [Required]
    public string UserName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Email обов'язковий")]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Пароль обов'язковий")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Пароль має бути мінімум 6 символів")]
    public string Password { get; set; } = string.Empty;

    public string? FirstName { get; set; } = string.Empty;

    public string? LastName { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string? Telegram { get; set; }
}