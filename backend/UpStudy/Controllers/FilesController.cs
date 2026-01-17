using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UpStudy.Interfaces;
using UpStudy.Models;
using System.Security.Claims;

namespace UpStudy.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IS3Service _s3Service;

    public FilesController(ApplicationDbContext context, IS3Service s3Service)
    {
        _context = context;
        _s3Service = s3Service;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin() => User.IsInRole("Admin") || User.IsInRole("Manager");

    /// <summary>
    /// Отримати посилання для завантаження файлу замовлення
    /// </summary>
    [HttpGet("order-attachment/{attachmentId}/download")]
    public async Task<IActionResult> GetOrderAttachmentDownloadUrl(Guid attachmentId)
    {
        var attachment = await _context.OrderAttachments
            .Include(a => a.Order)
            .FirstOrDefaultAsync(a => a.Id == attachmentId);

        if (attachment == null)
            return NotFound("Файл не знайдено");

        var order = attachment.Order;
        var userId = GetUserId();
        
        // Контроль доступу
        bool hasAccess = order.ClientId == userId || order.ExecutorId == userId || IsAdmin();
        
        if (attachment.IsResultWork && !hasAccess)
            return Forbid();

        var url = await _s3Service.GetPresignedDownloadUrlAsync(attachment.S3Key);
        
        return Ok(new { url, expiresIn = 3600 }); // 1 година
    }

    /// <summary>
    /// Отримати посилання для перегляду файлу (картинка/PDF в браузері)
    /// </summary>
    [HttpGet("order-attachment/{attachmentId}/view")]
    public async Task<IActionResult> GetOrderAttachmentViewUrl(Guid attachmentId)
    {
        var attachment = await _context.OrderAttachments
            .Include(a => a.Order)
            .FirstOrDefaultAsync(a => a.Id == attachmentId);

        if (attachment == null)
            return NotFound("Файл не знайдено");

        var order = attachment.Order;
        var userId = GetUserId();
        
        bool hasAccess = order.ClientId == userId || order.ExecutorId == userId || IsAdmin();
        
        if (attachment.IsResultWork && !hasAccess)
            return Forbid();

        var url = await _s3Service.GetPresignedViewUrlAsync(attachment.S3Key);
        
        return Ok(new { url, expiresIn = 3600 });
    }

    /// <summary>
    /// Отримати посилання для файлу чату
    /// </summary>
    [HttpGet("chat-attachment/{attachmentId}/download")]
    public async Task<IActionResult> GetChatAttachmentDownloadUrl(Guid attachmentId)
    {
        var attachment = await _context.ChatAttachments
            .Include(a => a.ChatMessage)
                .ThenInclude(m => m.Chat)
                .ThenInclude(c => c.Order)
            .FirstOrDefaultAsync(a => a.Id == attachmentId);

        if (attachment == null)
            return NotFound("Файл не знайдено");

        var order = attachment.ChatMessage.Chat.Order;
        var userId = GetUserId();
        
        bool hasAccess = order.ClientId == userId || order.ExecutorId == userId || IsAdmin();
        
        if (!hasAccess)
            return Forbid();

        var url = await _s3Service.GetPresignedDownloadUrlAsync(attachment.S3Key);
        
        return Ok(new { url, expiresIn = 3600 });
    }

    /// <summary>
    /// Завантажити аватар користувача
    /// </summary>
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);
        
        if (user == null)
            return NotFound();

        // Перевірка типу файлу
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest("Дозволені тільки зображення (JPEG, PNG, WEBP)");

        // Перевірка розміру (макс 5MB)
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("Максимальний розмір файлу 5MB");

        // Видаляємо старий аватар, якщо є
        if (!string.IsNullOrEmpty(user.AvatarS3Key))
        {
            await _s3Service.DeleteFileAsync(user.AvatarS3Key);
        }

        // Завантажуємо новий
        var s3Key = await _s3Service.UploadFileAsync(file, "avatars");
        user.AvatarS3Key = s3Key;
        
        await _context.SaveChangesAsync();

        var viewUrl = await _s3Service.GetPresignedViewUrlAsync(s3Key);
        
        return Ok(new { s3Key, viewUrl });
    }

    /// <summary>
    /// Отримати URL аватара користувача
    /// </summary>
    [HttpGet("avatar/{userId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvatarUrl(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        
        if (user == null || string.IsNullOrEmpty(user.AvatarS3Key))
            return NotFound();

        var url = await _s3Service.GetPresignedViewUrlAsync(user.AvatarS3Key);
        
        return Ok(new { url, expiresIn = 3600 });
    }

    /// <summary>
    /// Видалити свій аватар
    /// </summary>
    [HttpDelete("avatar")]
    public async Task<IActionResult> DeleteAvatar()
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);
        
        if (user == null || string.IsNullOrEmpty(user.AvatarS3Key))
            return NotFound();

        await _s3Service.DeleteFileAsync(user.AvatarS3Key);
        user.AvatarS3Key = null;
        
        await _context.SaveChangesAsync();

        return NoContent();
    }
}