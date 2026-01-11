using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class CreateReviewDto
{
    [Required]
    [Range(1, 5, ErrorMessage = "Оцінка має бути від 1 до 5")]
    public int Rating { get; set; }

    [MaxLength(1000, ErrorMessage = "Відгук занадто довгий")]
    public string Text { get; set; } = string.Empty;
}