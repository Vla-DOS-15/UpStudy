namespace UpStudy.Models;

public class Direction
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public List<Discipline> Disciplines { get; set; } = new();
}