using UpStudy.Dtos;
using UpStudy.Dtos.Payments;
using UpStudy.Models;

namespace UpStudy.Interfaces;

public interface IPaymentService
{
    // 6.0 Генерація форми оплати
    Task<LiqPayCheckoutDto> CreateCommissionCheckoutAsync(Guid orderId, string userId);
    
    // 6.1 Обробка вебхука
    Task ProcessLiqPayWebhookAsync(Dictionary<string, string> requestData);

    // 6.2 Прямі рахунки
    Task<PaymentRequestDto> CreateRequestAsync(string userId, CreatePaymentRequestDto dto);
    Task<PaymentRequestDto> UploadReceiptAsync(Guid requestId, string userId, IFormFile file);
    Task<PaymentRequestDto> ConfirmPaymentAsync(Guid requestId, string userId);
    Task<PaymentRequestDto> RejectPaymentAsync(Guid requestId, string userId, RejectPaymentDto dto);
    Task<List<PaymentRequestDto>> GetRequestsByOrderAsync(Guid orderId, string userId);
}