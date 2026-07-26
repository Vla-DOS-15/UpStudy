using UpStudy.Dtos;

namespace UpStudy.Interfaces;

public interface IConsultantService
{
    Task<List<ConsultantPreviewDto>> GetTopConsultantsAsync();
}
