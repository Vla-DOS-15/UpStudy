

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UpStudy.Dtos;
using UpStudy.Dtos.Payments;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IChatService _chatService;
    private readonly IS3Service _s3Service;

    public PaymentService(ApplicationDbContext context, IConfiguration configuration, IChatService chatService, IS3Service s3Service)
    {
        _context = context;
        _configuration = configuration;
        _chatService = chatService;
        _s3Service = s3Service;
    }

    // ... (LiqPay methods omitted for brevity, keeping existing) ...

    public async Task<LiqPayCheckoutDto> CreateCommissionCheckoutAsync(Guid orderId, string userId)
    {
        var order = await _context.Orders.FindAsync(orderId);
        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.ClientId != userId) throw new UnauthorizedAccessException("Це не ваше замовлення");
        if (order.ExecutorId == null) throw new InvalidOperationException("Виконавця ще не обрано");
        if (order.IsCommissionPaid) throw new InvalidOperationException("Комісія вже оплачена");

        var publicKey = _configuration["LiqPay:PublicKey"];
        var privateKey = _configuration["LiqPay:PrivateKey"];
        var callbackUrl = _configuration["LiqPay:CallbackUrl"];

        // Формуємо JSON параметрів для LiqPay
        var closingParams = new
        {
            public_key = publicKey,
            version = 3,
            action = "pay",
            amount = order.PlatformCommission,
            currency = "UAH",
            description = $"Комісія UpStudy за замовлення #{order.Id}",
            order_id = order.Id.ToString(), // Передаємо наш ID, щоб зловити його в Webhook
            server_url = callbackUrl,       // Сюди прийде POST запит після оплати
            result_url = "https://your-client-app.com/orders/" + order.Id // Куди повернути юзера
        };

        var jsonString = JsonSerializer.Serialize(closingParams);
        var data = Convert.ToBase64String(Encoding.UTF8.GetBytes(jsonString));
        var signature = GenerateSignature(privateKey!, data);

        return new LiqPayCheckoutDto
        {
            Data = data,
            Signature = signature
        };
    }

    // --- 6.1 WEBHOOK ---
    public async Task ProcessLiqPayWebhookAsync(Dictionary<string, string> requestData)
    {
        var data = requestData["data"];
        var receivedSignature = requestData["signature"];
        var privateKey = _configuration["LiqPay:PrivateKey"];

        // 1. Валідація підпису (Security Check)
        var expectedSignature = GenerateSignature(privateKey!, data);
        if (receivedSignature != expectedSignature)
        {
            throw new InvalidOperationException("Invalid Signature");
        }

        // 2. Декодування даних
        var jsonBytes = Convert.FromBase64String(data);
        var jsonString = Encoding.UTF8.GetString(jsonBytes);
        using var doc = JsonDocument.Parse(jsonString);
        var root = doc.RootElement;

        var status = root.GetProperty("status").GetString();
        var orderIdString = root.GetProperty("order_id").GetString();

        // LiqPay повертає status: "success", "sandbox" (для тестів)
        if (status == "success" || status == "sandbox")
        {
            if (Guid.TryParse(orderIdString, out Guid orderId))
            {
                var order = await _context.Orders.FindAsync(orderId);
                if (order != null && !order.IsCommissionPaid)
                {
                    // АКТИВАЦІЯ ЗАМОВЛЕННЯ
                    order.IsCommissionPaid = true;
                    
                    // Якщо статус був New (або WaitingForPayment), переводимо в InProgress
                    if (order.Status == OrderStatus.New) 
                    {
                        order.Status = OrderStatus.InProgress;
                    }

                    await _context.SaveChangesAsync();

                    // Сповіщення в чат
                    await _chatService.SendSystemMessageAsync(orderId, "✅ Комісію оплачено! Контакти відкрито. Можете починати роботу.");
                }
            }
        }
    }

    // --- 6.2 ПРЯМІ РАХУНКИ (Payment Requests) ---
    public async Task<PaymentRequestDto> CreateRequestAsync(string userId, CreatePaymentRequestDto dto)
    {
        var order = await _context.Orders
            .Include(o => o.Executor)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId);

        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.ExecutorId != userId) throw new UnauthorizedAccessException("Ви не виконавець цього замовлення");
        // Можна дозволити створювати запити і в статусі New, якщо треба передоплата, 
        // але зазвичай це InProgress. Якщо логіка вимагає - розкоментуйте:
        // if (order.Status != OrderStatus.InProgress) ...

        var executor = await _context.Users.FindAsync(userId);
        if (string.IsNullOrEmpty(executor?.BankCardNumber))
            throw new InvalidOperationException("Будь ласка, додайте номер картки у своєму профілі перед створенням запиту.");

        var request = new DirectPaymentRequest
        {
            OrderId = dto.OrderId,
            Amount = dto.Amount,
            Comment = dto.Comment,
            Status = PaymentRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            // Зберігаємо зліпок даних карти
            CardNumber = executor.BankCardNumber,
            CardOwnerName = executor.BankCardOwnerName ?? "Unknown"
        };

        _context.DirectPaymentRequests.Add(request);
        await _context.SaveChangesAsync();

        // Сповіщення в чат
        await _chatService.SendSystemMessageAsync(order.Id, $"🧾 Виконавець виставив рахунок на суму {dto.Amount} грн.\nКоментар: {dto.Comment}");

        return await MapToDtoAsync(request);
    }

    public async Task<PaymentRequestDto> UploadReceiptAsync(Guid requestId, string userId, IFormFile file)
    {
        var request = await _context.DirectPaymentRequests
            .Include(r => r.Order)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null) throw new KeyNotFoundException("Запит не знайдено");
        if (request.Order.ClientId != userId) throw new UnauthorizedAccessException("Ви не клієнт цього замовлення");

        var key = await _s3Service.UploadFileAsync(file, "receipts");

        request.ReceiptS3Key = key;
        request.Status = PaymentRequestStatus.MarkedAsPaid; // Клієнт завантажив чек = "Оплатив"
        
        await _context.SaveChangesAsync();
        
        await _chatService.SendSystemMessageAsync(request.OrderId, $"💳 Клієнт прикріпив чек до рахунку на {request.Amount} грн. Очікується підтвердження.");

        return await MapToDtoAsync(request);
    }

    public async Task<PaymentRequestDto> ConfirmPaymentAsync(Guid requestId, string userId)
    {
        var request = await _context.DirectPaymentRequests
            .Include(r => r.Order)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null) throw new KeyNotFoundException("Запит не знайдено");
        if (request.Order.ExecutorId != userId) throw new UnauthorizedAccessException("Ви не виконавець цього замовлення");

        request.Status = PaymentRequestStatus.Confirmed;
        request.PaidAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _chatService.SendSystemMessageAsync(request.OrderId, $"💰 Виконавець підтвердив отримання {request.Amount} грн.");

        // Check if Order is fully paid? (Optional logic)
        
        return await MapToDtoAsync(request);
    }

    public async Task<PaymentRequestDto> RejectPaymentAsync(Guid requestId, string userId, RejectPaymentDto dto)
    {
        var request = await _context.DirectPaymentRequests
            .Include(r => r.Order)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null) throw new KeyNotFoundException("Запит не знайдено");
        if (request.Order.ExecutorId != userId) throw new UnauthorizedAccessException("Ви не виконавець цього замовлення");

        request.Status = PaymentRequestStatus.Rejected;
        request.RejectReason = dto.Reason;
        // Optionally clear receipt so client can upload new one? Or keep history.
        // Keeping history is better, client might need to create NEW payment attempt or we allow re-upload.
        // If we allow re-upload, we might need a status like 'ReceiptRejected'.
        // For now, simple 'Rejected'.
        
        await _context.SaveChangesAsync();
        
        await _chatService.SendSystemMessageAsync(request.OrderId, $"❌ Оплата відхилена. Причина: {dto.Reason}");

        return await MapToDtoAsync(request);
    }

    public async Task<List<PaymentRequestDto>> GetRequestsByOrderAsync(Guid orderId, string userId)
    {
        // Перевірка доступу (клієнт або виконавець цього ордера)
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) return new List<PaymentRequestDto>();
        
        if (order.ClientId != userId && order.ExecutorId != userId) 
            throw new UnauthorizedAccessException("Немає доступу до цього замовлення");

        var requests = await _context.DirectPaymentRequests
            .Where(r => r.OrderId == orderId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var result = new List<PaymentRequestDto>();

        foreach(var r in requests)
        {
            result.Add(await MapToDtoAsync(r));
        }
        return result;
    }

    private async Task<PaymentRequestDto> MapToDtoAsync(DirectPaymentRequest r)
    {
        string? receiptUrl = null;
        if (!string.IsNullOrEmpty(r.ReceiptS3Key))
        {
            try
            {
                receiptUrl = await _s3Service.GetPresignedViewUrlAsync(r.ReceiptS3Key);
            }
            catch { /* Ignore if fails */ }
        }

        return new PaymentRequestDto
        {
            Id = r.Id,
            Amount = r.Amount,
            Comment = r.Comment,
            Status = r.Status.ToString(),
            CardNumber = r.CardNumber,
            CardOwnerName = r.CardOwnerName,
            ReceiptUrl = receiptUrl, 
            RejectReason = r.RejectReason,
            CreatedAt = r.CreatedAt,
            PaidAt = r.PaidAt
        };
    }

    // Helper: Генерація підпису LiqPay (Base64(SHA1(PrivateKey + Data + PrivateKey)))
    private string GenerateSignature(string privateKey, string data)
    {
        var source = privateKey + data + privateKey;
        using var sha1 = SHA1.Create();
        var hashBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(source));
        return Convert.ToBase64String(hashBytes);
    }
}