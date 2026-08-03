using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace UpStudy.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IR2Service _r2Service;
    private readonly ApplicationDbContext _context;

    public UsersController(UserManager<AppUser> userManager, IR2Service r2Service, ApplicationDbContext context)
    {
        _userManager = userManager;
        _r2Service = r2Service;
        _context = context;
    }

    [HttpGet("{id}/profile")]
    public async Task<IActionResult> GetUserProfile(string id)
    {
        var user = await _userManager.Users
            .Include(u => u.PreferredDisciplines)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new { Error = "Користувача не знайдено" });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var isExecutor = roles.Contains("Executor");
        var isClient = roles.Contains("Client");

        string? avatarUrl = null;
        if (!string.IsNullOrEmpty(user.AvatarS3Key))
        {
            avatarUrl = await _r2Service.GetPresignedViewUrlAsync(user.AvatarS3Key, 60 * 24 * 7);
        }

        var profile = new PublicUserProfileDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            UserName = user.UserName ?? string.Empty,
            AvatarUrl = avatarUrl,
            AboutMe = user.AboutMe,
            RegisteredAt = user.RegisteredAt,
            Roles = roles.ToList(),
            // Executor specific
            IsVerified = user.IsVerified,
            Rating = user.Rating,
            PreferredDisciplines = user.PreferredDisciplines.Select(d => d.Name).ToList()
        };

        // Get reviews
        var reviewsQuery = _context.Reviews
            .Include(r => r.Order)
            .Include(r => r.TargetUser)
            .AsQueryable();

        if (isExecutor)
        {
            // If viewing an executor, show reviews left ABOUT them
            reviewsQuery = reviewsQuery.Where(r => r.TargetUserId == id);
            // Completed orders as executor
            profile.CompletedOrdersCount = await _context.Orders.CountAsync(o => o.ExecutorId == id && o.Status == OrderStatus.Completed);
        }
        else
        {
            // If viewing a client, show reviews left BY them to executors, OR reviews ABOUT them as a client
            reviewsQuery = reviewsQuery.Where(r => r.TargetUserId == id || r.AuthorId == id);
            // Completed orders as client
            profile.CompletedOrdersCount = await _context.Orders.CountAsync(o => o.ClientId == id && o.Status == OrderStatus.Completed);
        }

        var reviewsList = await reviewsQuery.OrderByDescending(r => r.CreatedAt).ToListAsync();
        
        // Prepare authors/targets mapping to resolve avatars (this could be optimized, but keeps it simple)
        var userIds = reviewsList.Select(r => r.AuthorId).Concat(reviewsList.Select(r => r.TargetUserId)).Distinct().ToList();
        var usersMap = await _userManager.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u);

        var reviewsDtoList = new List<ReviewDto>();

        foreach (var r in reviewsList)
        {
            var author = usersMap.GetValueOrDefault(r.AuthorId);
            var target = usersMap.GetValueOrDefault(r.TargetUserId);

            string? authorAvatarUrl = null;
            if (author != null && !string.IsNullOrEmpty(author.AvatarS3Key))
            {
                authorAvatarUrl = await _r2Service.GetPresignedViewUrlAsync(author.AvatarS3Key, 60 * 24);
            }

            string? targetAvatarUrl = null;
            if (target != null && !string.IsNullOrEmpty(target.AvatarS3Key))
            {
                targetAvatarUrl = await _r2Service.GetPresignedViewUrlAsync(target.AvatarS3Key, 60 * 24);
            }

            reviewsDtoList.Add(new ReviewDto
            {
                Id = r.Id,
                Rating = r.Rating,
                Text = r.Text,
                CreatedAt = r.CreatedAt,
                AuthorId = r.AuthorId,
                AuthorName = author != null ? (string.IsNullOrEmpty(author.UserName) ? $"{author.FirstName} {author.LastName}" : $"@{author.UserName}") : "Unknown",
                AuthorAvatarUrl = authorAvatarUrl,
                TargetUserId = r.TargetUserId,
                TargetUserName = target != null ? (string.IsNullOrEmpty(target.UserName) ? $"{target.FirstName} {target.LastName}" : $"@{target.UserName}") : "Unknown",
                TargetUserAvatarUrl = targetAvatarUrl,
                OrderId = r.OrderId,
                OrderTitle = r.Order?.Title ?? "Unknown"
            });
        }

        profile.Reviews = reviewsDtoList;

        return Ok(profile);
    }
}
