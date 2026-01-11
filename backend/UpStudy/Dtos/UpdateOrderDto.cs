using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class UpdateOrderDto
{
    [Required(ErrorMessage = "Вкажіть назву")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Вкажіть опис")]
    public string Description { get; set; } = string.Empty;

    public bool IsNegotiable { get; set; }
    public decimal? Price { get; set; }

    [Required]
    public DateTime Deadline { get; set; }

    public int DisciplineId { get; set; }
    public int WorkTypeId { get; set; }
}