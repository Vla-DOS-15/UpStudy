namespace UpStudy.Dtos;

public class ConsultantPreviewDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double Rating { get; set; }
    public int CompletedOrdersCount { get; set; }
    public bool IsVerified { get; set; }
    public string? AboutMe { get; set; }
    public List<string> Disciplines { get; set; } = new();
}
