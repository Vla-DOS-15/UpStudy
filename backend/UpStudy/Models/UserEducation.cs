using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UpStudy.Models;

public class UserEducation
{
    public int Id { get; set; }
    
    [Required]
    public string AppUserId { get; set; } = string.Empty;
    [ForeignKey("AppUserId")]
    public AppUser AppUser { get; set; } = null!;
    
    public string UniversityName { get; set; } = string.Empty;
    public bool IsOtherUniversity { get; set; } = false;
    
    public string Degree { get; set; } = string.Empty;
    public int StartYear { get; set; }
    
    public bool IsStudyingNow { get; set; } = false;
    public int? EndYear { get; set; }
    
    // Може бути дипломом або довідкою з місця навчання/студентським квитком
    public string? DocumentS3Key { get; set; }
}
