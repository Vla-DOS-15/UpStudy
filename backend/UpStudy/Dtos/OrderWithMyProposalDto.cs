using UpStudy.Dtos;

namespace UpStudy.Dtos;

public class OrderWithMyProposalDto : OrderPreviewDto
{
    public Guid MyProposalId { get; set; }
    public string MyProposalStatus { get; set; } = string.Empty; // Pending, Accepted, Rejected
    public decimal MyPrice { get; set; }
}
