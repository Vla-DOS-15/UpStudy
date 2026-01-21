using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpStudy.Dtos.Admin;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Services;

public class AdminService : IAdminService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IS3Service _s3Service;

    public AdminService(UserManager<AppUser> userManager, ApplicationDbContext context, IS3Service s3Service)
    {
        _userManager = userManager;
        _context = context;
        _s3Service = s3Service;
    }

    // Отримати список заявок на верифікацію
    public async Task<List<UserPreviewDto>> GetPendingVerificationsAsync()
    {
        return await _userManager.Users
            .Where(u => u.IsVerificationPending && !u.IsVerified)
            .Select(u => new UserPreviewDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = $"{u.FirstName} {u.LastName}",
                RegisteredAt = DateTime.UtcNow // Якщо є таке поле
            })
            .ToListAsync();
    }

    // Отримати деталі заявки (з посиланнями на фото)
    public async Task<VerificationDetailsDto> GetVerificationDetailsAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new KeyNotFoundException("Користувача не знайдено");

        var passportUrl = user.PassportS3Key != null 
            ? await _s3Service.GetPresignedViewUrlAsync(user.PassportS3Key) 
            : null;
            
        var diplomaUrl = user.DiplomaS3Key != null 
            ? await _s3Service.GetPresignedViewUrlAsync(user.DiplomaS3Key) 
            : null;

        return new VerificationDetailsDto
        {
            UserId = user.Id,
            FullName = $"{user.FirstName} {user.LastName}",
            PassportUrl = passportUrl,
            DiplomaUrl = diplomaUrl
        };
    }

    // Підтвердити
    public async Task ApproveUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new KeyNotFoundException();

        user.IsVerified = true;
        user.IsVerificationPending = false;
        user.VerificationRejectReason = null;
        
        await _userManager.UpdateAsync(user);
        
        // Тут можна відправити email: "Вас підтверджено!"
    }

    // Відхилити
    public async Task RejectUserAsync(string userId, string reason)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new KeyNotFoundException();

        user.IsVerified = false;
        user.IsVerificationPending = false;
        user.VerificationRejectReason = reason;

        // Можна видаляти файли з S3, щоб не займати місце, або лишати для історії
        // await _s3Service.DeleteFileAsync(user.PassportS3Key);

        await _userManager.UpdateAsync(user);
    }

    public async Task<List<UserPreviewDto>> GetAllUsersAsync()
    {
        // Використовуємо _context замість _userManager для доступу до таблиць UserRoles та Roles
        return await _context.Users
            .AsNoTracking() // Оптимізація для читання (не відстежує зміни)
            .Select(u => new UserPreviewDto
            {
                Id = u.Id,
                Email = u.Email ?? "No Email",
                FullName = $"{u.FirstName} {u.LastName}",
            
                // --- ЛОГІКА ОТРИМАННЯ РОЛІ ---
                // Ми робимо підзапит:
                // 1. Беремо запис з таблиці UserRoles, де UserId збігається.
                // 2. З'єднуємо з таблицею Roles, щоб отримати Name.
                // 3. Беремо першу знайдену роль (або "User", якщо ролі немає).
                Role = _context.UserRoles
                    .Where(ur => ur.UserId == u.Id)
                    .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                    .FirstOrDefault() ?? "User",
            
                IsVerified = u.IsVerified,
                IsVerificationPending = u.IsVerificationPending,
                IsBlocked = u.LockoutEnd != null && u.LockoutEnd > DateTimeOffset.UtcNow
            })
            .ToListAsync();
    }
    
    public async Task ToggleBlockUserAsync(string userId, bool isBlocked)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new KeyNotFoundException("Користувача не знайдено");

        if (isBlocked)
        {
            // Блокуємо на 100 років (назавжди)
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
        }
        else
        {
            // Розблоковуємо (ставимо null)
            await _userManager.SetLockoutEndDateAsync(user, null);
        }
    }
}