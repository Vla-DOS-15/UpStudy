namespace UpStudy.Dtos;

public class PaymentRequestDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Pending, MarkedAsPaid, Confirmed, Rejected
    
    public string CardNumber { get; set; } = string.Empty;
    public string CardOwnerName { get; set; } = string.Empty;
    
    public string? ReceiptUrl { get; set; }
    public string? RejectReason { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
}
