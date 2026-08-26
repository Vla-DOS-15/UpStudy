using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpStudy.Dtos.Admin;
using UpStudy.Interfaces;
using UpStudy.Services;

namespace UpStudy.Controllers;

[ApiController]
[Route("api/[controller]")]
// Базовий захист: сюди можуть лізти тільки Адміни або Менеджери
[Authorize(Roles = "Admin,VerificationManager,UserManager")] 
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IOrderService _orderService;
    private readonly IDictionaryService _dictionaryService;

    public AdminController(IAdminService adminService, IOrderService orderService, IDictionaryService dictionaryService)
    {
        _adminService = adminService;
        _orderService = orderService;
        _dictionaryService = dictionaryService;
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

    [HttpGet("universities")]
    public async Task<IActionResult> GetAllUniversities()
    {
        var universities = await _dictionaryService.GetAllUniversitiesAsync();
        return Ok(universities);
    }

    [HttpPost("universities")]
    public async Task<IActionResult> CreateUniversity([FromBody] UpStudy.Models.University university)
    {
        var result = await _dictionaryService.CreateUniversityAsync(university);
        return Ok(result);
    }

    [HttpPut("universities/{id}")]
    public async Task<IActionResult> UpdateUniversity(int id, [FromBody] UpStudy.Models.University university)
    {
        var result = await _dictionaryService.UpdateUniversityAsync(id, university);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("universities/{id}")]
    public async Task<IActionResult> DeleteUniversity(int id)
    {
        var success = await _dictionaryService.DeleteUniversityAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("universities/bulk-delete")]
    public async Task<IActionResult> BulkDeleteUniversities([FromBody] List<int> ids)
    {
        await _dictionaryService.BulkDeleteUniversitiesAsync(ids);
        return NoContent();
    }

    [HttpPost("universities/populate")]
    public async Task<IActionResult> PopulateUniversities([FromBody] List<UpStudy.Models.University> universities)
    {
        var addedCount = await _dictionaryService.PopulateUniversitiesAsync(universities);
        return Ok(new { Message = $"Успішно додано {addedCount} нових університетів." });
    }
}