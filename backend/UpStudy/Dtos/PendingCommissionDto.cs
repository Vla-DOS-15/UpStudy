namespace UpStudy.Dtos;

public class PendingCommissionDto
{
    public Guid OrderId { get; set; }
    public string OrderTitle { get; set; } = string.Empty;
    public decimal CommissionAmount { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string ReceiptViewUrl { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } // We can use Order's UpdatedAt or a specific field, but let's just use a general time for now or Order.CreatedAt. Let's add a time if we need, but for now we can omit it if not strictly required.
}
