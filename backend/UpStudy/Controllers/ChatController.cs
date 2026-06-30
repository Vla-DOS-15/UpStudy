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

    [HttpGet("my-chats")]
    public async Task<IActionResult> GetMyChats()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        
        try
        {
            var chats = await _chatService.GetUserChatsAsync(userId);
            return Ok(chats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("{orderId}")]
    public async Task<IActionResult> GetChatHistory(Guid orderId, [FromQuery] string? candidateId = null)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        try
        {
            return Ok(await _chatService.GetMessagesAsync(orderId, userId, candidateId));
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException) { return NotFound("Чат не знайдено"); }
    }

    [HttpGet("user-status/{userId}")]
    public async Task<IActionResult> GetUserStatus(string userId)
    {
         return Ok(await _chatService.GetUserLastActiveAsync(userId));
    }

    // 4.1 Надіслати текстове повідомлення (HTTP POST)
    [HttpPost("{orderId}/messages")]
    public async Task<IActionResult> SendMessage(Guid orderId, [FromBody] SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Повідомлення не може бути пустим");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            var messageDto = await _chatService.SaveMessageAsync(orderId, userId, dto.Text, dto.CandidateId);
            return Ok(messageDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("{orderId}/files")]
    public async Task<IActionResult> UploadFile(Guid orderId, IFormFile file, [FromForm] string? candidateId = null)
    {
        if (file == null || file.Length == 0) return BadRequest("Файл не обрано");
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            var messageDto = await _chatService.SaveFileMessageAsync(orderId, userId, file, candidateId);
            return Ok(messageDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
    [HttpPost("init")]
    public async Task<IActionResult> InitChat([FromBody] InitChatDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        try
        {
            var chatId = await _chatService.GetChatIdAsync(dto.OrderId, userId, dto.CandidateId);
            return Ok(new { chatId });
        }
        catch (Exception ex)
        {
             return BadRequest(ex.Message);
        }
    }

    [HttpGet("room/{chatId}")]
    public async Task<IActionResult> GetChatRoom(Guid chatId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        try
        {
            return Ok(await _chatService.GetMessagesByChatIdAsync(chatId, userId));
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("room/{chatId}/messages")]
    public async Task<IActionResult> SendMessageByChatId(Guid chatId, [FromBody] SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Повідомлення не може бути пустим");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            // Note: dto.CandidateId is ignored here as ChatId defines the participants
            var messageDto = await _chatService.SaveMessageByChatIdAsync(chatId, userId, dto.Text);
            return Ok(messageDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("room/{chatId}/files")]
    public async Task<IActionResult> UploadFileByChatId(Guid chatId, IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("Файл не обрано");
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            var messageDto = await _chatService.SaveFileMessageByChatIdAsync(chatId, userId, file);
            return Ok(messageDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}