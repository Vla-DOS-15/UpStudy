using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpStudy.Dtos;
using UpStudy.Interfaces;

namespace UpStudy.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IS3Service _s3Service;

    public OrdersController(IOrderService orderService, IS3Service s3Service)
    {
        _orderService = orderService;
        _s3Service = s3Service;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateOrder([FromForm] CreateOrderDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("Не вдалося визначити користувача");

        try
        {
            var createdOrder = await _orderService.CreateOrderAsync(userId, dto);

            // Генеруємо presigned URLs для всіх файлів
            var attachmentDtos = new List<AttachmentDto>();
            
            foreach (var attachment in createdOrder.Attachments)
            {
                var viewUrl = await _s3Service.GetPresignedViewUrlAsync(attachment.S3Key, expirationMinutes: 60);
                var downloadUrl = await _s3Service.GetPresignedDownloadUrlAsync(attachment.S3Key, expirationMinutes: 60);
                
                attachmentDtos.Add(new AttachmentDto
                {
                    Id = attachment.Id,
                    OriginalFileName = attachment.OriginalFileName,
                    ViewUrl = viewUrl,
                    DownloadUrl = downloadUrl,
                    UploadedAt = attachment.UploadedAt,
                    IsResultWork = attachment.IsResultWork
                });
            }

            var response = new OrderResponseDto
            {
                Id = createdOrder.Id,
                Title = createdOrder.Title,
                Description = createdOrder.Description,
                Price = createdOrder.Price,
                IsNegotiable = createdOrder.IsNegotiable,
                Deadline = createdOrder.Deadline,
                Status = createdOrder.Status.ToString(),
                CreatedAt = createdOrder.CreatedAt,
                Attachments = attachmentDtos
            };

            return CreatedAtAction(nameof(GetOrderById), new { id = response.Id }, response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Помилка сервера: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderById(Guid id)
    {
        var orderDto = await _orderService.GetOrderByIdAsync(id);

        if (orderDto == null) 
            return NotFound("Замовлення не знайдено");

        return Ok(orderDto);
    }
    
    // --- 2.1 PUT: Редагування замовлення ---
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateOrder(Guid id, [FromBody] UpdateOrderDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            var updatedOrder = await _orderService.UpdateOrderAsync(id, userId, dto);
            
            // Повертаємо оновлені дані. Можна використати OrderResponseDto, якщо він у вас є.
            return Ok(new { Message = "Замовлення оновлено", OrderId = updatedOrder.Id, Title = updatedOrder.Title });
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Замовлення не знайдено");
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid(); // 403 Forbidden
        }
        catch (InvalidOperationException ex) // Порушення бізнес-правил (є ставки або не той статус)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Помилка сервера: {ex.Message}");
        }
    }

    // --- 2.2 GET: Список ставок для замовлення ---
    [HttpGet("{id}/proposals")]
    [Authorize]
    public async Task<IActionResult> GetOrderProposals(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            var proposals = await _orderService.GetProposalsForOrderAsync(id, userId);
            return Ok(proposals);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Замовлення не знайдено");
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("Ви не маєте права переглядати ставки до цього замовлення.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
    
    
    [HttpPost("{id}/accept-executor")]
    [Authorize]
    public async Task<IActionResult> AcceptExecutor(Guid id, [FromBody] AcceptExecutorDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            await _orderService.AcceptExecutorAsync(id, userId!, dto.ProposalId);
            return Ok(new { Message = "Виконавця прийнято. Кошти заморожено." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("{id}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteOrder(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try
        {
            await _orderService.CompleteOrderAsync(id, userId!);
            return Ok(new { Message = "Замовлення завершено. Кошти перераховано." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpPost("{id}/revision")]
    [Authorize]
    public async Task<IActionResult> RequestRevision(Guid id, [FromBody] RevisionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _orderService.RequestRevisionAsync(id, userId!, dto.Comment);
        return Ok(new { Message = "Відправлено на доопрацювання" });
    }

    [HttpPost("{id}/dispute")]
    [Authorize]
    public async Task<IActionResult> OpenDispute(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _orderService.OpenDisputeAsync(id, userId!);
        return Ok(new { Message = "Арбітраж відкрито" });
    }
    
    
    // 2.7 POST: Залишити відгук
    [HttpPost("{id}/review")]
    [Authorize]
    public async Task<IActionResult> LeaveReview(Guid id, [FromBody] CreateReviewDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            await _orderService.LeaveReviewAsync(id, userId, dto);
            return Ok(new { Message = "Відгук успішно додано." });
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Замовлення не знайдено");
        }
        catch (UnauthorizedAccessException) // 403 Forbidden
        {
            return Forbid();
        }
        catch (InvalidOperationException ex) // Не той статус або відгук вже є
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
    
    
    // 3.0 GET: Пошук замовлень (публічний або тільки для авторизованих)
    [HttpGet] 
    // [Authorize] - розкоментуйте, якщо переглядати можуть тільки зареєстровані
    public async Task<IActionResult> GetOrders([FromQuery] SearchOrdersQuery query)
    {
        try
        {
            var result = await _orderService.SearchOrdersAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
    
    
    [HttpPost("{id}/submit-review")]
    [Authorize]
    public async Task<IActionResult> SubmitForReview(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        try 
        {
            await _orderService.SubmitForReviewAsync(id, userId!);
            return Ok(new { Message = "Роботу відправлено на перевірку" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
    
    [HttpGet("my-orders")]
    [Authorize]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            var orders = await _orderService.GetUserOrdersAsync(userId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}