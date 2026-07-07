namespace UpStudy.Dtos;

public class SearchOrdersQuery
{
    public int? DisciplineId { get; set; }
    public int? WorkTypeId { get; set; }
    
    public string? Search { get; set; }
    
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }

    // Пагінація
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

// Легка модель для списку (щоб не тягнути зайві дані типу файлів чи чатів)
public class OrderPreviewDto
{
    public Guid Id { get; set; }
    public int OrderNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public bool IsNegotiable { get; set; }
    public DateTime Deadline { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = string.Empty;

    // Назви категорій (щоб не робити зайві запити на клієнті)
    public string DisciplineName { get; set; } = string.Empty;
    public string WorkTypeName { get; set; } = string.Empty;
    
    // Інфо про замовника
    public string ClientName { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string? ExecutorId { get; set; }
    
    // Індикатор для виконавців, щоб знати статус власної ставки
    public bool HasMyProposal { get; set; }
    public Guid? MyProposalId { get; set; }
}

// Обгортка для пагінації
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageSize { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}