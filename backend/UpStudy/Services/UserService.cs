using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly IS3Service _s3Service;

    public UserService(ApplicationDbContext context, IS3Service s3Service)
    {
        _context = context;
        _s3Service = s3Service;
    }

    public async Task<List<AuthorDto>> GetTopAuthorsAsync(int limit = 20)
    {
        var users = await _context.Users
            .Where(u => u.CompletedOrdersCount > 0 || u.Rating > 0)
            .OrderByDescending(u => u.Rating)
            .ThenByDescending(u => u.CompletedOrdersCount)
            .Take(limit)
            // Використовуємо проекцію для оптимізації та уникнення N+1
            .Select(user => new 
            {
                user.Id,
                user.UserName, // Use UserName
                user.AvatarS3Key,
                user.Rating,
                user.CompletedOrdersCount,
                user.AboutMe,
                ReviewsCount = user.Reviews.Count
            })
            .ToListAsync();

        var dtos = new List<AuthorDto>();

        foreach (var user in users)
        {
            string? avatarUrl = null;
            if (!string.IsNullOrEmpty(user.AvatarS3Key))
            {
                avatarUrl = await _s3Service.GetPresignedViewUrlAsync(user.AvatarS3Key);
            }

            dtos.Add(new AuthorDto
            {
                Id = user.Id,
                UserName = user.UserName ?? "Unknown", // Handle null
                AvatarUrl = avatarUrl,
                Rating = user.Rating,
                CompletedOrdersCount = user.CompletedOrdersCount,
                AboutMe = user.AboutMe,
                ReviewsCount = user.ReviewsCount
            });
        }
        
        return dtos;
    }
    public async Task<string> UploadAvatarAsync(string userId, IFormFile file)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException("User not found");

        // Validate file (optional: check extension, size)
        
        // Upload to S3
        var s3Key = await _s3Service.UploadFileAsync(file, "avatars");

        // Update User
        user.AvatarS3Key = s3Key;
        await _context.SaveChangesAsync();

        // Return view URL
        return await _s3Service.GetPresignedViewUrlAsync(s3Key);
    }

    public async Task UpdateProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new Exception("User not found");

        // 1. Перевірка UserName
        if (user.UserName != dto.UserName)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == dto.UserName);
            if (existingUser != null)
                throw new Exception("Цей юзернейм вже зайнятий");
            
            user.UserName = dto.UserName;
            user.NormalizedUserName = dto.UserName.ToUpper();
        }

        // 2. Валідація для виконавця
        var isExecutor = await _context.UserRoles
            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
            .AnyAsync(x => x.UserId == userId && x.Name == "Executor");

        if (isExecutor) 
        {
             if (string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName))
                 throw new Exception("Ім'я та прізвище обов'язкові");
             
             if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
                 throw new Exception("Номер телефону обов'язковий");
        }

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.PhoneNumber = dto.PhoneNumber;
        user.BankCardNumber = dto.BankCardNumber;
        user.BankCardOwnerName = dto.BankCardOwnerName;

        await _context.SaveChangesAsync();
    }
}
