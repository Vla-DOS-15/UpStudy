using System.ComponentModel.DataAnnotations;

namespace UpStudy.Dtos.Admin;

public class RejectDto
{
    [Required(ErrorMessage = "Вкажіть причину відмови")]
    public string Reason { get; set; } = string.Empty;
}