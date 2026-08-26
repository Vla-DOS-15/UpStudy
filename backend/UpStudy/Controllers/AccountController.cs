using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;
using Microsoft.EntityFrameworkCore;

namespace UpStudy.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<AppUser> _userManager;
    private readonly IR2Service _r2Service;
    private readonly ApplicationDbContext _context;

    public AccountController(IAuthService authService, UserManager<AppUser> userManager,  IR2Service r2Service, ApplicationDbContext context)
    {
        _authService = authService;
        _userManager = userManager;
        _r2Service =  r2Service;
        _context = context;
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == null) 
            return Unauthorized();

        var result = await _authService.ChangePasswordAsync(userId, model.CurrentPassword, model.NewPassword);

        if (!result)
            return BadRequest(new { Message = "Не вдалося змінити пароль. Перевірте поточний пароль." });

        return Ok(new { Message = "Пароль успішно змінено. Будь ласка, увійдіть знову." });
    }
    
    [HttpPost("verify")]
    [Authorize]
    public async Task<IActionResult> UploadVerificationDocs([FromForm] VerificationDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        // Перевірка: чи це точно виконавець? (Якщо у вас ролі зберігаються в Claims або в БД)
        // var roles = await _userManager.GetRolesAsync(user);
        // if (!roles.Contains("Executor")) return BadRequest("Тільки виконавці проходять верифікацію");

        try 
        {
            // 1. Завантажуємо Паспорт (Приватний файл!)
            // isPublicRead = false (за замовчуванням)
            var passportKey = await _r2Service.UploadFileAsync(dto.Passport, "verification-docs/passports");
        
            // 2. Завантажуємо Диплом (Приватний файл!)
            var diplomaKey = await _r2Service.UploadFileAsync(dto.Diploma, "verification-docs/diplomas");

            // 3. Оновлюємо користувача
            user.PassportS3Key = passportKey;
            user.DiplomaS3Key = diplomaKey;
            user.IsVerificationPending = true; // Відправляємо на модерацію
            user.IsVerified = false; // Поки адмін не підтвердить

            await _userManager.UpdateAsync(user);

            return Ok(new { Message = "Документи відправлено на перевірку. Очікуйте підтвердження адміністратора." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Помилка завантаження: {ex.Message}");
        }
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.Users
            .Include(u => u.PreferredDisciplines)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);

        string? avatarUrl = null;
        if (!string.IsNullOrEmpty(user.AvatarS3Key))
        {
            avatarUrl = await _r2Service.GetPresignedViewUrlAsync(user.AvatarS3Key, 60 * 24 * 7); // 7 days expiration
        }

        var profile = new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            UserName = user.UserName ?? string.Empty,
            Roles = roles.ToList(),
            IsVerified = user.IsVerified,
            IsVerificationPending = user.IsVerificationPending,
            AvatarUrl = avatarUrl,
            PhoneNumber = user.PhoneNumber,
            Telegram = user.Telegram,
            PreferredDisciplineIds = user.PreferredDisciplines.Select(d => d.Id).ToList()
        };

        return Ok(profile);
    }

    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile avatar)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        if (avatar == null || avatar.Length == 0)
        {
            return BadRequest(new { Message = "No file uploaded." });
        }

        try
        {
            var key = await _r2Service.UploadFileAsync(avatar, "avatars");
            user.AvatarS3Key = key;
            await _userManager.UpdateAsync(user);

            var url = await _r2Service.GetPresignedViewUrlAsync(key, 60 * 24 * 7);
            return Ok(new { avatarUrl = url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Помилка завантаження: {ex.Message}");
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.Users
            .Include(u => u.PreferredDisciplines)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null) return NotFound();

        user.FirstName = model.FirstName;
        user.LastName = model.LastName;
        user.AboutMe = model.AboutMe;
        user.PhoneNumber = model.PhoneNumber;

        if (!string.IsNullOrWhiteSpace(model.UserName) && model.UserName != user.UserName)
        {
            var existingUser = await _userManager.FindByNameAsync(model.UserName);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return BadRequest(new { Message = "Цей юзернейм вже зайнятий іншим користувачем." });
            }
            user.UserName = model.UserName;
        }

        string? formattedTelegram = model.Telegram;
        if (!string.IsNullOrWhiteSpace(formattedTelegram) && !formattedTelegram.StartsWith("@"))
        {
            formattedTelegram = "@" + formattedTelegram;
        }
        user.Telegram = formattedTelegram;

        // Оновлюємо дисципліни
        var selectedDisciplines = await _context.Disciplines
            .Where(d => model.PreferredDisciplineIds.Contains(d.Id))
            .ToListAsync();

        user.PreferredDisciplines.Clear();
        user.PreferredDisciplines.AddRange(selectedDisciplines);

        await _userManager.UpdateAsync(user);

        return Ok(new { Message = "Профіль успішно оновлено." });
    }

    [HttpGet("reviews")]
    public async Task<IActionResult> GetMyReviews()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var isExecutor = await _userManager.IsInRoleAsync(user, "Executor");

        var reviewsQuery = _context.Reviews
            .Include(r => r.Order)
            .Include(r => r.TargetUser)
            .AsQueryable();

        if (isExecutor)
        {
            // Виконавець бачить відгуки ПРО НЬОГО
            reviewsQuery = reviewsQuery.Where(r => r.TargetUserId == userId);
        }
        else
        {
            // Клієнт бачить ВЛАСНІ відгуки
            reviewsQuery = reviewsQuery.Where(r => r.AuthorId == userId);
        }

        var reviewsList = await reviewsQuery.OrderByDescending(r => r.CreatedAt).ToListAsync();
        var authorIds = reviewsList.Select(r => r.AuthorId).Distinct().ToList();
        var authors = await _userManager.Users.Where(u => authorIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u);

        var result = new List<ReviewDto>();

        foreach (var r in reviewsList)
        {
            var author = authors.GetValueOrDefault(r.AuthorId);
            string? authorAvatarUrl = null;
            if (author != null && !string.IsNullOrEmpty(author.AvatarS3Key))
            {
                authorAvatarUrl = await _r2Service.GetPresignedViewUrlAsync(author.AvatarS3Key, 60 * 24 * 7);
            }

            string? targetAvatarUrl = null;
            if (r.TargetUser != null && !string.IsNullOrEmpty(r.TargetUser.AvatarS3Key))
            {
                targetAvatarUrl = await _r2Service.GetPresignedViewUrlAsync(r.TargetUser.AvatarS3Key, 60 * 24 * 7);
            }

            result.Add(new ReviewDto
            {
                Id = r.Id,
                Rating = r.Rating,
                Text = r.Text,
                CreatedAt = r.CreatedAt,
                
                AuthorId = r.AuthorId,
                AuthorName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : "Unknown",
                AuthorAvatarUrl = authorAvatarUrl,
                
                TargetUserId = r.TargetUserId,
                TargetUserName = r.TargetUser != null ? $"{r.TargetUser.FirstName} {r.TargetUser.LastName}".Trim() : "Unknown",
                TargetUserAvatarUrl = targetAvatarUrl,
                
                OrderId = r.OrderId,
                OrderTitle = r.Order?.Title ?? "Unknown"
            });
        }

        return Ok(result);
    }

    [HttpPost("upload-document")]
    public async Task<IActionResult> UploadDocument(IFormFile file)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "application/pdf" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { Message = "Дозволені тільки зображення та PDF (JPEG, PNG, WEBP, PDF)" });

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new { Message = "Максимальний розмір файлу 10MB" });

        try
        {
            var key = await _r2Service.UploadFileAsync(file, "verification-docs");
            return Ok(new { s3Key = key });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Помилка завантаження: {ex.Message}");
        }
    }

    [HttpPost("setup-profile")]
    public async Task<IActionResult> SetupProfile([FromBody] SetupProfileDto model)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.Users
            .Include(u => u.PreferredDisciplines)
            .Include(u => u.Educations)
            .Include(u => u.Certificates)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null) return NotFound();

        // 1. Оновлення основної інформації
        user.FirstName = model.FirstName;
        user.LastName = model.LastName;
        user.PhoneNumber = model.PhoneNumber;

        if (model.DateOfBirth.HasValue)
        {
            user.DateOfBirth = DateTime.SpecifyKind(model.DateOfBirth.Value, DateTimeKind.Utc);
        }
        else
        {
            user.DateOfBirth = null;
        }
        
        string? formattedTelegram = model.Telegram;
        if (!string.IsNullOrWhiteSpace(formattedTelegram) && !formattedTelegram.StartsWith("@"))
        {
            formattedTelegram = "@" + formattedTelegram;
        }
        user.Telegram = formattedTelegram;

        if (!string.IsNullOrWhiteSpace(model.UserName) && model.UserName != user.UserName)
        {
            var existingUser = await _userManager.FindByNameAsync(model.UserName);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return BadRequest(new { Message = "Цей юзернейм вже зайнятий іншим користувачем." });
            }
            user.UserName = model.UserName;
        }

        // 2. Предмети
        var selectedDisciplines = await _context.Disciplines
            .Where(d => model.PreferredDisciplineIds.Contains(d.Id))
            .ToListAsync();
        user.PreferredDisciplines.Clear();
        user.PreferredDisciplines.AddRange(selectedDisciplines);

        // 3. Освіта
        user.Educations.Clear();
        foreach (var edu in model.Educations)
        {
            user.Educations.Add(new UserEducation
            {
                UniversityName = edu.UniversityName,
                IsOtherUniversity = edu.IsOtherUniversity,
                Degree = edu.Degree,
                StartYear = edu.StartYear,
                IsStudyingNow = edu.IsStudyingNow,
                EndYear = edu.EndYear,
                DocumentS3Key = edu.DocumentS3Key
            });
        }

        // 4. Сертифікати
        user.Certificates.Clear();
        foreach (var cert in model.Certificates)
        {
            user.Certificates.Add(new UserCertificate
            {
                Name = cert.Name,
                StartMonth = cert.StartMonth,
                StartYear = cert.StartYear,
                EndMonth = cert.EndMonth,
                EndYear = cert.EndYear,
                Url = cert.Url
            });
        }

        // 5. Реквізити
        user.CardFullName = model.CardFullName;
        user.BankCardNumber = model.BankCardNumber;
        user.BankFullName = model.BankFullName;
        user.BankIpn = model.BankIpn;
        user.BankIban = model.BankIban;

        // 6. Верифікація (паспорт зберігаємо)
        if (!string.IsNullOrEmpty(model.PassportS3Key))
        {
            user.PassportS3Key = model.PassportS3Key;
        }
        
        user.IsVerificationPending = true;
        user.IsVerified = false;

        await _userManager.UpdateAsync(user);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Профіль налаштовано. Очікуйте підтвердження адміністратора." });
    }
}