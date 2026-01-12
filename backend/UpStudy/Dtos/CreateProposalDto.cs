using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class CreateProposalDto
{
    [Required]
    public Guid OrderId { get; set; }

    [Required]
    [Range(20, 200000, ErrorMessage = "Ціна має бути від 20 до 200 000")]
    public decimal Price { get; set; }

    [Required]
    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Коментар має бути від 10 до 1000 символів")]
    public string Comment { get; set; } = string.Empty;
}