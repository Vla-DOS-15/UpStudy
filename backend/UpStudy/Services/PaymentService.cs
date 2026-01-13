using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UpStudy.Dtos.Payments;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IChatService _chatService; // Щоб сповіщати про статус

    public PaymentService(ApplicationDbContext context, IConfiguration configuration, IChatService chatService)
    {
        _context = context;
        _configuration = configuration;
        _chatService = chatService;
    }

    // --- 6.0 ГЕНЕРАЦІЯ CHEKOUT ---
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

    // --- 6.2 ПРЯМІ РАХУНКИ (INVOICES) ---
    public async Task<DirectPaymentRequest> CreateInvoiceAsync(string executorId, CreateInvoiceDto dto)
    {
        var order = await _context.Orders.FindAsync(dto.OrderId);
        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.ExecutorId != executorId) throw new UnauthorizedAccessException("Ви не виконавець цього замовлення");
        if (order.Status != OrderStatus.InProgress) throw new InvalidOperationException("Замовлення має бути в роботі");

        var invoice = new DirectPaymentRequest
        {
            OrderId = dto.OrderId,
            Amount = dto.Amount,
            Comment = dto.Comment,
            Status = PaymentRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.DirectPaymentRequests.Add(invoice);
        await _context.SaveChangesAsync();

        // Сповіщення в чат
        await _chatService.SendSystemMessageAsync(order.Id, $"🧾 Виконавець виставив рахунок на суму {dto.Amount} грн. Коментар: {dto.Comment}");

        return invoice;
    }

    public async Task MarkInvoiceAsPaidAsync(Guid invoiceId, string clientId)
    {
        var invoice = await _context.DirectPaymentRequests.Include(i => i.Order).FirstOrDefaultAsync(i => i.Id == invoiceId);
        if (invoice == null) throw new KeyNotFoundException();
        if (invoice.Order.ClientId != clientId) throw new UnauthorizedAccessException();

        invoice.Status = PaymentRequestStatus.MarkedAsPaid;
        await _context.SaveChangesAsync();
        
        await _chatService.SendSystemMessageAsync(invoice.OrderId, $"💳 Клієнт позначив рахунок на {invoice.Amount} грн як оплачений. Очікується підтвердження виконавця.");
    }

    public async Task ConfirmInvoiceAsync(Guid invoiceId, string executorId)
    {
        var invoice = await _context.DirectPaymentRequests.Include(i => i.Order).FirstOrDefaultAsync(i => i.Id == invoiceId);
        if (invoice == null) throw new KeyNotFoundException();
        if (invoice.Order.ExecutorId != executorId) throw new UnauthorizedAccessException();

        invoice.Status = PaymentRequestStatus.Confirmed;
        invoice.PaidAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _chatService.SendSystemMessageAsync(invoice.OrderId, $"💰 Виконавець підтвердив отримання {invoice.Amount} грн.");
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