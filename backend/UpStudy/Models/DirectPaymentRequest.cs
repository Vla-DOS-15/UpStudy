using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class DirectPaymentRequest
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public decimal Amount { get; set; }
    public string Comment { get; set; } = string.Empty;
    
    // Зліпок даних карти на момент створення запиту (щоб якщо юзер змінив карту, старі запити не ламались)
    public string CardNumber { get; set; } = string.Empty;
    public string CardOwnerName { get; set; } = string.Empty;

    public string? ReceiptS3Key { get; set; } // Фото чека
    public string? RejectReason { get; set; } // Причина відхилення

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }

    // Статуси: Pending (очікує), Paid (клієнт сказав що оплатив), Confirmed (виконавець підтвердив отримання)
    public PaymentRequestStatus Status { get; set; } = PaymentRequestStatus.Pending;

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
}

public enum PaymentRequestStatus
{
    Pending = 1,          // Виставлено
    MarkedAsPaid = 2,     // Клієнт натиснув "Оплатив"
    Confirmed = 3,        // Виконавець підтвердив
    Rejected = 4          // Відхилено
}