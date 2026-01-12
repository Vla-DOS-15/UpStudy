using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UpStudy.Dtos.Chat;
using UpStudy.Interfaces;

namespace UpStudy.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    // hubContext тут НЕ ПОТРІБЕН, бо розсилку робить сервіс
    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpGet("{orderId}")]
    public async Task<IActionResult> GetChatHistory(Guid orderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            return Ok(await _chatService.GetMessagesAsync(orderId, userId));
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException) { return NotFound("Чат не знайдено"); }
    }

    // 4.1 Надіслати текстове повідомлення (HTTP POST)
    [HttpPost("{orderId}/messages")]
    public async Task<IActionResult> SendMessage(Guid orderId, [FromBody] SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Повідомлення не може бути пустим");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        try
        {
            // Викликаємо сервіс. Він збереже в БД і САМ надішле SignalR сповіщення
            var messageDto = await _chatService.SaveMessageAsync(orderId, userId, dto.Text);
            return Ok(messageDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("{orderId}/files")]
    public async Task<IActionResult> UploadFile(Guid orderId, IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("Файл не обрано");
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        try
        {
            // Сервіс збереже файл і САМ надішле SignalR сповіщення
            var messageDto = await _chatService.SaveFileMessageAsync(orderId, userId, file);
            return Ok(messageDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}