using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UpStudy.Dtos;
using UpStudy.Models;
using UpStudy.Services;

namespace UpStudy.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Всі методи цього контролера вимагають авторизації
public class AccountController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<AppUser> _userManager;

    public AccountController(IAuthService authService, UserManager<AppUser> userManager)
    {
        _authService = authService;
        _userManager = userManager;
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Отримуємо ID з Claims (це надійно, бо токен перевірено)
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == null) 
            return Unauthorized();

        // Викликаємо сервіс (переконайтеся, що цей метод реалізований в AuthService)
        var result = await _authService.ChangePasswordAsync(userId, model.CurrentPassword, model.NewPassword);

        if (!result)
            return BadRequest(new { Message = "Не вдалося змінити пароль. Перевірте поточний пароль." });

        return Ok(new { Message = "Пароль успішно змінено. Будь ласка, увійдіть знову." });
    }
}