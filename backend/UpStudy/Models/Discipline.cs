namespace UpStudy.Models;

public class Discipline
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public int DirectionId { get; set; }
    public Direction Direction { get; set; } = null!;
}