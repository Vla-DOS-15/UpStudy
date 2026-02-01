using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class CreatePaymentRequestDto
{
    [Required]
    public Guid OrderId { get; set; }

    [Required]
    [Range(1, 1000000)]
    public decimal Amount { get; set; }

    public string Comment { get; set; } = string.Empty;
}
