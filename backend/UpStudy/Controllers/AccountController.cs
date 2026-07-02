using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<AppUser> _userManager;
    private readonly IR2Service _r2Service;

    public AccountController(IAuthService authService, UserManager<AppUser> userManager,  IR2Service r2Service)
    {
        _authService = authService;
        _userManager = userManager;
        _r2Service =  r2Service;
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
}