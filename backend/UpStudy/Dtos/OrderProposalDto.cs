namespace UpStudy.Dtos;

public class OrderProposalDto
{
    public Guid Id { get; set; }
    public decimal Price { get; set; }
    public int DaysToComplete { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    
    public string ExecutorId { get; set; } = string.Empty;
    public string ExecutorName { get; set; } = string.Empty;
    public string? ExecutorAvatar { get; set; }
}