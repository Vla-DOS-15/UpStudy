using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class AcceptExecutorDto
{
    [Required]
    public Guid ProposalId { get; set; }
}