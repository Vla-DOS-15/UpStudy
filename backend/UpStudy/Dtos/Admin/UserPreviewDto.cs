namespace UpStudy.Dtos.Admin;

public class UserPreviewDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public bool IsVerificationPending { get; set; }
    public bool IsBlocked { get; set; }
    public DateTime RegisteredAt { get; set; }
}