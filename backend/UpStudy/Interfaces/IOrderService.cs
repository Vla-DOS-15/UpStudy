using UpStudy.Dtos;
using UpStudy.Models;

namespace UpStudy.Interfaces;

public interface IOrderService
{
    Task<Order> CreateOrderAsync(string clientId, CreateOrderDto dto);
    Task<Order> UpdateOrderAsync(Guid orderId, string userId, UpdateOrderDto dto);
    Task DeleteOrderAsync(Guid id, string userId);
    Task<List<OrderProposalDto>> GetProposalsForOrderAsync(Guid orderId, string userId);
    Task AcceptExecutorAsync(Guid orderId, string clientId, Guid proposalId);
    Task RejectExecutorAsync(Guid orderId, string clientId, Guid proposalId);
    Task CompleteOrderAsync(Guid orderId, string clientId);
    Task RequestRevisionAsync(Guid orderId, string clientId, string comment);
    Task OpenDisputeAsync(Guid orderId, string clientId);
    Task LeaveReviewAsync(Guid orderId, string clientId, CreateReviewDto dto);
    
    Task<PagedResult<OrderPreviewDto>> SearchOrdersAsync(SearchOrdersQuery query);

    Task SubmitForReviewAsync(Guid orderId, string executorId);
    Task<OrderResponseDto?> GetOrderByIdAsync(Guid orderId);
    Task<List<OrderPreviewDto>> GetUserOrdersAsync(string userId);
    Task<List<OrderWithMyProposalDto>> GetUserProposalsAsync(string userId);
}