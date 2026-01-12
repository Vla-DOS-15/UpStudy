using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class Order
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public bool IsNegotiable { get; set; }
    public decimal? Price { get; set; }
    
    // Ціна роботи (те, що отримає виконавець на карту)
    public decimal ExecutorPrice { get; set; }

    // Комісія платформи (те, що клієнт платить через WayForPay/LiqPay)
    public decimal PlatformCommission { get; set; }
    
    // Чи оплачена комісія платформи?
    public bool IsCommissionPaid { get; set; } = false;
    
    // Зв'язок з транзакціями прямих оплат (див. нижче)
    public List<DirectPaymentRequest> PaymentRequests { get; set; } = new();
    
    public DateTime Deadline { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.New;

    public int DisciplineId { get; set; }
    public Discipline Discipline { get; set; } = null!;

    public int WorkTypeId { get; set; }
    public WorkType WorkType { get; set; } = null!;

    public string ClientId { get; set; } = string.Empty;
    public AppUser Client { get; set; } = null!;

    public string? ExecutorId { get; set; }
    public AppUser? Executor { get; set; }

    public List<OrderAttachment> Attachments { get; set; } = new();

    // Навігація
    public List<OrderProposal> Proposals { get; set; } = new();
    public Chat? Chat { get; set; } 
    public Review? Review { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!IsNegotiable && (Price == null || Price < 20))
        {
            yield return new ValidationResult("Вкажіть ціну не менше 20 або оберіть 'Договірна'.", new[] { nameof(Price) });
        }
        if (IsNegotiable && Price != null)
        {
            yield return new ValidationResult("Для договірної ціни поле суми має бути пустим.", new[] { nameof(Price) });
        }
    }
}