using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpStudy.Dtos;
using UpStudy.Dtos.Payments;
using UpStudy.Interfaces;

namespace UpStudy.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    // 6.0 [Клієнт] Отримати посилання на оплату комісії
    [HttpPost("commission/checkout/{orderId}")]
    [Authorize]
    public async Task<IActionResult> GetCommissionCheckout(Guid orderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            var result = await _paymentService.CreateCommissionCheckoutAsync(orderId, userId!);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    // 6.1 [System] LiqPay Webhook (Цей метод викликає LiqPay!)
    // AllowAnonymous - бо LiqPay не має нашого JWT токена
    [HttpPost("commission/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> LiqPayCallback([FromForm] Dictionary<string, string> data)
    {
        // LiqPay надсилає дані як x-www-form-urlencoded (data, signature)
        try
        {
            if (!data.ContainsKey("data") || !data.ContainsKey("signature"))
                return BadRequest("Invalid request");

            await _paymentService.ProcessLiqPayWebhookAsync(data);
            return Ok();
        }
        catch (Exception ex)
        {
            // Логування помилки
            return StatusCode(500, ex.Message);
        }
    }

    // --- DIRECT PAYMENTS (UPDATED) ---

    // [Виконавець] Створити запит на оплату
    [HttpPost("requests")]
    [Authorize]
    public async Task<IActionResult> CreateRequest([FromBody] CreatePaymentRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            var result = await _paymentService.CreateRequestAsync(userId!, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    // [Клієнт] Завантажити чек (Оплатити)
    [HttpPost("requests/{id}/receipt")]
    [Authorize]
    public async Task<IActionResult> UploadReceipt(Guid id, IFormFile file)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            var result = await _paymentService.UploadReceiptAsync(id, userId!, file);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    // [Виконавець] Підтвердити оплату
    [HttpPost("requests/{id}/confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmPayment(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            var result = await _paymentService.ConfirmPaymentAsync(id, userId!);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    // [Виконавець] Відхилити оплату
    [HttpPost("requests/{id}/reject")]
    [Authorize]
    public async Task<IActionResult> RejectPayment(Guid id, [FromBody] RejectPaymentDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            var result = await _paymentService.RejectPaymentAsync(id, userId!, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    // [Обидва] Отримати список запитів по замовлення
    [HttpGet("order/{orderId}")]
    [Authorize]
    public async Task<IActionResult> GetByOrder(Guid orderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            var result = await _paymentService.GetRequestsByOrderAsync(orderId, userId!);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
}