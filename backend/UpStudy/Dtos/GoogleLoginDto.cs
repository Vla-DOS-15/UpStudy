namespace UpStudy.Dtos;

public class GoogleLoginDto 
{ 
    public string Code { get; set; } = string.Empty;
    public string? Role { get; set; }
}