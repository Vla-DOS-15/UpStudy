using UpStudy.Dtos;
using UpStudy.Models;

namespace UpStudy.Interfaces;

public interface IOrderService
{
    Task<Order> CreateOrderAsync(string clientId, CreateOrderDto dto);
    Task<Order> UpdateOrderAsync(Guid orderId, string userId, UpdateOrderDto dto);
    Task<List<OrderProposalDto>> GetProposalsForOrderAsync(Guid orderId, string userId);
}