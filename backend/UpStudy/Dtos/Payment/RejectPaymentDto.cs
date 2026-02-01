using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class RejectPaymentDto
{
    [Required]
    public string Reason { get; set; } = string.Empty;
}
