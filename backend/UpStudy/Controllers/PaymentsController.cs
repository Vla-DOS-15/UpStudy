using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    // 6.2 [Виконавець] Виставити прямий рахунок
    [HttpPost("invoices")]
    [Authorize]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            var invoice = await _paymentService.CreateInvoiceAsync(userId!, dto);
            return Ok(invoice);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    // [Клієнт] Я оплатив
    [HttpPost("invoices/{id}/pay")]
    [Authorize]
    public async Task<IActionResult> MarkAsPaid(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _paymentService.MarkInvoiceAsPaidAsync(id, userId!);
        return Ok(new { Message = "Позначено як оплачено" });
    }

    // [Виконавець] Підтверджую
    [HttpPost("invoices/{id}/confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmInvoice(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _paymentService.ConfirmInvoiceAsync(id, userId!);
        return Ok(new { Message = "Оплату підтверджено" });
    }

    // [Спільне] Огляд балансу та історії транзакцій
    [HttpGet("balance")]
    [Authorize]
    public async Task<IActionResult> GetBalanceOverview()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            var overview = await _paymentService.GetBalanceOverviewAsync(userId!);
            return Ok(overview);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
}