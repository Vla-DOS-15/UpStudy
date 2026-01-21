using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class VerificationDto
{
    [Required]
    public IFormFile Passport { get; set; } = null!;

    [Required]
    public IFormFile Diploma { get; set; } = null!;
}