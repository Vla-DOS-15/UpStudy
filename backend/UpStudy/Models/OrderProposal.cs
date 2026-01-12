using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class OrderProposal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public decimal Price { get; set; }
    public string Comment { get; set; } = string.Empty;
    public ProposalStatus Status { get; set; } = ProposalStatus.Pending;

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public string ExecutorId { get; set; } = string.Empty;
    public AppUser Executor { get; set; } = null!;
}