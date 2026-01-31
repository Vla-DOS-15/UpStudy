namespace UpStudy.Dtos.Admin;

public class VerificationDetailsDto
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    // Посилання на документи (можуть бути null, якщо не завантажені)
    public string? PassportUrl { get; set; }
    public string? DiplomaUrl { get; set; }
    
    public DateTime RegisteredAt { get; set; }
}