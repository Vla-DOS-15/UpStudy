using UpStudy.Models;

namespace UpStudy.Services;

public interface IDictionaryService
{
    Task<List<University>> SearchUniversitiesAsync(string query, int limit = 20);
    Task<List<University>> GetAllUniversitiesAsync();
    Task<University?> GetUniversityByIdAsync(int id);
    Task<University> CreateUniversityAsync(University university);
    Task<University?> UpdateUniversityAsync(int id, University university);
    Task<bool> DeleteUniversityAsync(int id);
    Task<bool> BulkDeleteUniversitiesAsync(List<int> ids);
    Task<int> PopulateUniversitiesAsync(List<University> universities);
}
