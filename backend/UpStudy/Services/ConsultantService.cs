using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Services;

public class ConsultantService : IConsultantService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IR2Service _r2Service;

    public ConsultantService(UserManager<AppUser> userManager, IR2Service r2Service)
    {
        _userManager = userManager;
        _r2Service = r2Service;
    }

    public async Task<List<ConsultantPreviewDto>> GetTopConsultantsAsync()
    {
        var executors = await _userManager.GetUsersInRoleAsync("Executor");
        var executorIds = executors.Select(e => e.Id).ToList();

        // Get fresh data from db including disciplines to avoid lazy loading issues
        var users = await _userManager.Users
            .Include(u => u.PreferredDisciplines)
            .Where(u => executorIds.Contains(u.Id))
            .OrderByDescending(u => u.Rating)
            .ThenByDescending(u => u.CompletedOrdersCount)
            .ToListAsync();

        var result = new List<ConsultantPreviewDto>();
        foreach (var u in users)
        {
            result.Add(new ConsultantPreviewDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                AvatarUrl = string.IsNullOrEmpty(u.AvatarS3Key) ? null : await _r2Service.GetPresignedViewUrlAsync(u.AvatarS3Key),
                Rating = u.Rating,
                CompletedOrdersCount = u.CompletedOrdersCount,
                IsVerified = u.IsVerified,
                AboutMe = u.AboutMe,
                Disciplines = u.PreferredDisciplines.Select(d => d.Name).ToList()
            });
        }

        return result;
    }
}
