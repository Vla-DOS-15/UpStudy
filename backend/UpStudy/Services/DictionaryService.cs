using Microsoft.EntityFrameworkCore;
using UpStudy.Models;

namespace UpStudy.Services;

public class DictionaryService : IDictionaryService
{
    private readonly ApplicationDbContext _context;

    public DictionaryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<University>> SearchUniversitiesAsync(string query, int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new List<University>();
        }

        var lowerQuery = query.ToLower();
        return await _context.Universities
            .AsNoTracking()
            .Where(u => EF.Functions.ILike(u.Name, $"%{lowerQuery}%") || 
                        (u.NameEn != null && EF.Functions.ILike(u.NameEn, $"%{lowerQuery}%")))
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<University>> GetAllUniversitiesAsync()
    {
        return await _context.Universities
            .AsNoTracking()
            .OrderBy(u => u.Name)
            .ToListAsync();
    }

    public async Task<University?> GetUniversityByIdAsync(int id)
    {
        return await _context.Universities.FindAsync(id);
    }

    public async Task<University> CreateUniversityAsync(University university)
    {
        _context.Universities.Add(university);
        await _context.SaveChangesAsync();
        return university;
    }

    public async Task<University?> UpdateUniversityAsync(int id, University university)
    {
        var existing = await _context.Universities.FindAsync(id);
        if (existing == null) return null;

        existing.Name = university.Name;
        existing.NameEn = university.NameEn;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteUniversityAsync(int id)
    {
        var existing = await _context.Universities.FindAsync(id);
        if (existing == null) return false;

        _context.Universities.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> BulkDeleteUniversitiesAsync(List<int> ids)
    {
        if (ids == null || !ids.Any()) return false;
        
        var universities = await _context.Universities.Where(u => ids.Contains(u.Id)).ToListAsync();
        if (universities.Any())
        {
            _context.Universities.RemoveRange(universities);
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }

    public async Task<int> PopulateUniversitiesAsync(List<University> universities)
    {
        var existingNames = await _context.Universities
            .Select(u => u.Name)
            .ToListAsync();

        var existingNamesSet = new HashSet<string>(existingNames.Select(n => n.ToLower()));
        
        int addedCount = 0;
        foreach (var u in universities)
        {
            if (!string.IsNullOrWhiteSpace(u.Name) && !existingNamesSet.Contains(u.Name.ToLower()))
            {
                _context.Universities.Add(u);
                existingNamesSet.Add(u.Name.ToLower());
                addedCount++;
            }
        }

        if (addedCount > 0)
        {
            await _context.SaveChangesAsync();
        }

        return addedCount;
    }
}
