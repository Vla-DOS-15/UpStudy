namespace UpStudy.Dtos;

public class AuthResponseDto
{
    public bool IsSuccess { get; set; }
    public string? Message { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
}