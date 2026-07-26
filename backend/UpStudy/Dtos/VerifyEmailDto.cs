using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class VerifyEmailDto
{
    [Required(ErrorMessage = "Email обов'язковий")]
    [EmailAddress(ErrorMessage = "Невірний формат Email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Код обов'язковий")]
    [StringLength(4, MinimumLength = 4, ErrorMessage = "Код має містити 4 цифри")]
    public string Code { get; set; } = string.Empty;
}

public class ResendVerificationDto
{
    [Required(ErrorMessage = "Email обов'язковий")]
    [EmailAddress(ErrorMessage = "Невірний формат Email")]
    public string Email { get; set; } = string.Empty;
}
