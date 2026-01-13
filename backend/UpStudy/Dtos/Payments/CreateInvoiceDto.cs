using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos.Payments;

public class CreateInvoiceDto
{
    [Required]
    public Guid OrderId { get; set; }
    
    [Required]
    [Range(1, 1000000)]
    public decimal Amount { get; set; }
    
    [Required]
    public string Comment { get; set; } = string.Empty;
}