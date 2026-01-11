namespace UpStudy.Dtos;

public class OrderResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public decimal? Price { get; set; }
    public string Status { get; set; }
    
    // Вкладений список DTO, а не сутностей
    public List<AttachmentDto> Attachments { get; set; } = new();
}