namespace UpStudy.Dtos;

public class AuthorDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double Rating { get; set; }
    public int CompletedOrdersCount { get; set; }
    public string? AboutMe { get; set; }
    public int ReviewsCount { get; set; }
}
