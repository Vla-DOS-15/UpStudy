namespace UpStudy.Dtos;

public class AttachmentDto
{
    public Guid Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public bool IsResultWork { get; set; }
    public DateTime UploadedAt { get; set; }
    
    // Presigned URLs (дійсні ~1 годину)
    public string ViewUrl { get; set; } = string.Empty;      // Для перегляду в браузері
    public string DownloadUrl { get; set; } = string.Empty;  // Для завантаження
}