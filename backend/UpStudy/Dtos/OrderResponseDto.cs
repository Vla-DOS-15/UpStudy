namespace UpStudy.Dtos;

public class OrderResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public bool IsNegotiable { get; set; }
    public DateTime Deadline { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = string.Empty;

    // Додані поля для відображення деталей (оскільки ми робимо Include)
    public int DisciplineId { get; set; }
    public string DisciplineName { get; set; } = string.Empty;
    public int WorkTypeId { get; set; }
    public string WorkTypeName { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty; // Корисно для посилання на профіль
    public string? ExecutorId { get; set; } // Щоб знати, чи є вже виконавець
    public int ViewsCount { get; set; }

    public List<AttachmentDto> Attachments { get; set; } = new();
}