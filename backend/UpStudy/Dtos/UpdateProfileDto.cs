namespace UpStudy.Dtos;

public class UpdateProfileDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AboutMe { get; set; }
    
    // Перелік ID дисциплін, які обрав виконавець
    public List<int> PreferredDisciplineIds { get; set; } = new();
}
