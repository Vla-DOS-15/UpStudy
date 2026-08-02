namespace UpStudy.Dtos;

public class UpdateProfileDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AboutMe { get; set; }
    
    public string? PhoneNumber { get; set; }
    public string? Telegram { get; set; }
    public string? UserName { get; set; }
    
    // Перелік ID дисциплін, які обрав виконавець
    public List<int> PreferredDisciplineIds { get; set; } = new();
}
