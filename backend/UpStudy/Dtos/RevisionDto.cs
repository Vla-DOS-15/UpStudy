using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class RevisionDto
{
    [Required]
    public string Comment { get; set; } = string.Empty;
}