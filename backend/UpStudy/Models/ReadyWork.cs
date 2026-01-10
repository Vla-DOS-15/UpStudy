using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class ReadyWork
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int SalesCount { get; set; } = 0;
    public double Rating { get; set; } = 0;

    public int DisciplineId { get; set; }
    public Discipline Discipline { get; set; } = null!;

    public int WorkTypeId { get; set; }
    public WorkType WorkType { get; set; } = null!;

    public string AuthorId { get; set; } = string.Empty;
    public AppUser Author { get; set; } = null!;

    public string DemoFilePath { get; set; } = string.Empty; // Безкоштовний перегляд
    public string OriginalFilePath { get; set; } = string.Empty; // Повний файл (після покупки)
}