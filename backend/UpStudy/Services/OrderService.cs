using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;
using Microsoft.EntityFrameworkCore;

namespace UpStudy.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public OrderService(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public async Task<Order> CreateOrderAsync(string clientId, CreateOrderDto dto)
    {
        // 1. Створюємо об'єкт замовлення
        var order = new Order
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            IsNegotiable = dto.IsNegotiable,
            Price = dto.IsNegotiable ? null : dto.Price,
            Deadline = dto.Deadline.ToUniversalTime(),
            CreatedAt = DateTime.UtcNow,
            Status = OrderStatus.New,
            ClientId = clientId,
            DisciplineId = dto.DisciplineId,
            WorkTypeId = dto.WorkTypeId,
            Attachments = new List<OrderAttachment>()
        };

        if (dto.Files != null && dto.Files.Any())
        {
            var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "orders");
            
            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            foreach (var file in dto.Files)
            {
                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadPath, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                order.Attachments.Add(new OrderAttachment
                {
                    OrderId = order.Id,
                    OriginalFileName = file.FileName,
                    FilePath = $"/uploads/orders/{uniqueFileName}",
                    UploadedAt = DateTime.UtcNow,
                    IsResultWork = false
                });
            }
        }

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return order;
    }
    
    public async Task<Order> UpdateOrderAsync(Guid orderId, string userId, UpdateOrderDto dto)
    {
        var order = await _context.Orders
            .Include(o => o.Proposals)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            throw new KeyNotFoundException("Замовлення не знайдено");

        if (order.ClientId != userId)
            throw new UnauthorizedAccessException("Ви не можете редагувати чуже замовлення");

        if (order.Status != OrderStatus.New)
            throw new InvalidOperationException("Замовлення не можна редагувати, бо воно вже в роботі або завершене.");

        if (order.Proposals.Any())
            throw new InvalidOperationException("Замовлення не можна редагувати, оскільки вже є ставки від виконавців.");

        order.Title = dto.Title;
        order.Description = dto.Description;
        order.IsNegotiable = dto.IsNegotiable;
        order.Price = dto.IsNegotiable ? null : dto.Price;
        order.Deadline = dto.Deadline.ToUniversalTime();
        order.DisciplineId = dto.DisciplineId;
        order.WorkTypeId = dto.WorkTypeId;

        _context.Orders.Update(order);
        await _context.SaveChangesAsync();

        return order;
    }

    public async Task<List<OrderProposalDto>> GetProposalsForOrderAsync(Guid orderId, string userId)
    {
        // 1. Шукаємо замовлення
        var order = await _context.Orders
            .Include(o => o.Proposals)
                .ThenInclude(p => p.Executor) // Підтягуємо дані виконавця
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            throw new KeyNotFoundException("Замовлення не знайдено");

        // 2. Перевірка доступу (тільки замовник бачить ставки)
        // (Можна додати логіку для Адміна тут через || User.IsInRole("Admin"))
        if (order.ClientId != userId)
            throw new UnauthorizedAccessException("Тільки автор замовлення може бачити ставки.");

        // 3. Мапимо в DTO
        var proposalsDto = order.Proposals.Select(p => new OrderProposalDto
        {
            Id = p.Id,
            Price = p.Price,
            DaysToComplete = p.DaysToComplete,
            Comment = p.Comment,
            Status = p.Status.ToString(),
            ExecutorId = p.ExecutorId,
            // Перевіряємо на null, про всяк випадок
            ExecutorName = p.Executor != null ? $"{p.Executor.FirstName} {p.Executor.LastName}" : "Unknown", 
            // ExecutorAvatar = p.Executor?.AvatarPath (якщо буде таке поле)
        }).ToList();

        return proposalsDto;
    }
}