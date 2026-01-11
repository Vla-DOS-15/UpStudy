using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public enum TransactionType
{
    Deposit = 1,          // Поповнення
    HoldForOrder = 2,     // Заморозка (Клієнт -> Система)
    ReleaseToExecutor = 3,// Виплата (Система -> Виконавець)
    RefundToClient = 4,   // Повернення (Система -> Клієнт)
    Withdrawal = 5        // Вивід коштів
}

public class WalletTransaction
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public decimal Amount { get; set; } // Сума зміни балансу (може бути мінусова)
    public TransactionType Type { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Description { get; set; } = string.Empty;

    // Зв'язок з гаманцем
    public Guid WalletId { get; set; }
    public Wallet Wallet { get; set; } = null!;

    // Опціонально: прив'язка до замовлення
    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }
}