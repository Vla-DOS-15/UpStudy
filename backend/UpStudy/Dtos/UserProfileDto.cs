namespace UpStudy.Dtos;

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public bool IsVerified { get; set; }
    public bool IsVerificationPending { get; set; }
    public string? AvatarUrl { get; set; }
}
