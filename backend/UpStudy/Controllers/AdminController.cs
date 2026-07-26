using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpStudy.Dtos.Admin;
using UpStudy.Interfaces;

namespace UpStudy.Controllers;

[ApiController]
[Route("api/[controller]")]
// Базовий захист: сюди можуть лізти тільки Адміни або Менеджери
[Authorize(Roles = "Admin,VerificationManager,UserManager")] 
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IOrderService _orderService;

    public AdminController(IAdminService adminService, IOrderService orderService)
    {
        _adminService = adminService;
        _orderService = orderService;
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin,VerificationManager,UserManager")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _adminService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    [HttpGet("verifications")]
    [Authorize(Policy = "CanVerifyUsers")] // Використовуємо політику!
    public async Task<IActionResult> GetPendingVerifications()
    {
        var list = await _adminService.GetPendingVerificationsAsync();
        return Ok(list);
    }

    [HttpGet("verifications/{userId}")]
    [Authorize(Policy = "CanVerifyUsers")]
    public async Task<IActionResult> GetVerificationDetails(string userId)
    {
        try {
            var details = await _adminService.GetVerificationDetailsAsync(userId);
            return Ok(details);
        } catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("verifications/{userId}/approve")]
    [Authorize(Policy = "CanVerifyUsers")]
    public async Task<IActionResult> Approve(string userId)
    {
        await _adminService.ApproveUserAsync(userId);
        return Ok(new { Message = "Користувача верифіковано" });
    }

    [HttpPost("verifications/{userId}/reject")]
    [Authorize(Policy = "CanVerifyUsers")]
    public async Task<IActionResult> Reject(string userId, [FromBody] RejectDto dto)
    {
        await _adminService.RejectUserAsync(userId, dto.Reason);
        return Ok(new { Message = "Верифікацію відхилено" });
    }
    
    [HttpGet("users")]
    [Authorize(Policy = "CanViewAllUsers")] // Переконайтесь, що така політика є в Program.cs
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _adminService.GetAllUsersAsync();
        return Ok(users);
    }
    
    [HttpPost("users/{userId}/block")]
    [Authorize(Policy = "CanViewAllUsers")]
    public async Task<IActionResult> ToggleBlock(string userId, [FromBody] BlockUserDto dto)
    {
        await _adminService.ToggleBlockUserAsync(userId, dto.IsBlocked);
        return Ok(new { Message = dto.IsBlocked ? "Користувача заблоковано" : "Користувача розблоковано" });
    }

    [HttpGet("commissions/pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPendingCommissions()
    {
        var result = await _orderService.GetPendingCommissionPaymentsAsync();
        return Ok(result);
    }

    [HttpPost("commissions/{orderId}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveCommission(Guid orderId)
    {
        try 
        {
            await _orderService.ApproveCommissionAsync(orderId);
            return Ok(new { Message = "Комісію підтверджено" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpPost("commissions/{orderId}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectCommission(Guid orderId, [FromBody] RejectDto dto)
    {
        try 
        {
            await _orderService.RejectCommissionAsync(orderId, dto.Reason);
            return Ok(new { Message = "Комісію відхилено" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
}