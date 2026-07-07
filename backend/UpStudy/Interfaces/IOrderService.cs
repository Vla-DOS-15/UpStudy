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
    Task CompleteOrderAsync(Guid orderId, string clientId);
    Task RequestRevisionAsync(Guid orderId, string clientId, string comment);
    Task OpenDisputeAsync(Guid orderId, string clientId);
    Task LeaveReviewAsync(Guid orderId, string clientId, CreateReviewDto dto);
    
    Task<PagedResult<OrderPreviewDto>> SearchOrdersAsync(SearchOrdersQuery query, string? currentUserId);
    Task<List<OrderPreviewDto>> GetPendingOrdersAsync(string userId);
    Task<List<OrderPreviewDto>> GetArchivedOrdersAsync(string userId);

    Task SubmitForReviewAsync(Guid orderId, string executorId);
    
    // Commission Payment Methods
    Task UploadCommissionReceiptAsync(Guid orderId, string clientId, IFormFile file);
    Task<List<PendingCommissionDto>> GetPendingCommissionPaymentsAsync();
    Task ApproveCommissionAsync(Guid orderId);
    Task RejectCommissionAsync(Guid orderId, string reason);

    Task<OrderResponseDto?> GetOrderByIdAsync(Guid orderId, string? currentUserId = null);
    Task<List<OrderPreviewDto>> GetUserOrdersAsync(string userId);
}