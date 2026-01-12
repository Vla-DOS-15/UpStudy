using UpStudy.Dtos;

namespace UpStudy.Interfaces;

public interface IProposalService
{
    Task<OrderProposalDto> CreateProposalAsync(string executorId, CreateProposalDto dto);
    Task DeleteProposalAsync(Guid proposalId, string executorId);
}