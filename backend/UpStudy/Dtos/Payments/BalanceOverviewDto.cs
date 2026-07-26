namespace UpStudy.Dtos.Payments;

public class BalanceOverviewDto
{
    public decimal TotalEarned { get; set; }
    public decimal TotalSpent { get; set; }
    
    public List<TransactionDto> Transactions { get; set; } = new();
}

public class TransactionDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsExpense { get; set; }
}
