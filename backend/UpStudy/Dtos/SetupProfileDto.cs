using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos;

public class SetupProfileDto
{
    [Required]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    public string LastName { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }
    public string? Telegram { get; set; }
    public string? UserName { get; set; }
    public DateTime? DateOfBirth { get; set; }

    // IDs вибраних предметів
    public List<int> PreferredDisciplineIds { get; set; } = new();

    // Освіта
    public List<EducationDto> Educations { get; set; } = new();

    // Сертифікати
    public List<CertificateDto> Certificates { get; set; } = new();

    // Реквізити Картки
    public string? CardFullName { get; set; }
    public string? BankCardNumber { get; set; }

    // Реквізити Банку
    public string? BankFullName { get; set; }
    public string? BankIpn { get; set; }
    public string? BankIban { get; set; }

    // Верифікація
    public string? PassportS3Key { get; set; }
}

public class EducationDto
{
    public string UniversityName { get; set; } = string.Empty;
    public bool IsOtherUniversity { get; set; }
    public string Degree { get; set; } = string.Empty;
    public int StartYear { get; set; }
    public bool IsStudyingNow { get; set; }
    public int? EndYear { get; set; }
    public string? DocumentS3Key { get; set; }
}

public class CertificateDto
{
    public string Name { get; set; } = string.Empty;
    public int StartMonth { get; set; }
    public int StartYear { get; set; }
    public int EndMonth { get; set; }
    public int EndYear { get; set; }
    public string? Url { get; set; }
}
