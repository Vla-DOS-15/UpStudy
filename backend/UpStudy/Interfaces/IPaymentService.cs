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
    Task<DirectPaymentRequest> CreateInvoiceAsync(string executorId, CreateInvoiceDto dto);
    Task ConfirmInvoiceAsync(Guid invoiceId, string executorId); // Виконавець підтверджує отримання
    Task MarkInvoiceAsPaidAsync(Guid invoiceId, string clientId); // Клієнт каже "Я оплатив"
}