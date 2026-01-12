using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;
using Microsoft.EntityFrameworkCore;

namespace UpStudy.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IChatService _chatService;
    
    private const decimal CommissionRate = 0.15m;
    
    public OrderService(ApplicationDbContext context, IWebHostEnvironment environment, IChatService chatService)
    {
        _context = context;
        _environment = environment;
        _chatService = chatService;
    }

    public async Task<Order> CreateOrderAsync(string clientId, CreateOrderDto dto)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            IsNegotiable = dto.IsNegotiable,
            Price = dto.IsNegotiable ? null : dto.Price,
            
            // Якщо ціна фіксована одразу, можемо попередньо порахувати (опціонально)
            // Але фінальний розрахунок буде при виборі виконавця
            ExecutorPrice = dto.IsNegotiable || dto.Price == null ? 0 : dto.Price.Value * (1 - CommissionRate),
            PlatformCommission = dto.IsNegotiable || dto.Price == null ? 0 : dto.Price.Value * CommissionRate,

            Deadline = dto.Deadline.ToUniversalTime(),
            CreatedAt = DateTime.UtcNow,
            Status = OrderStatus.New,
            ClientId = clientId,
            DisciplineId = dto.DisciplineId,
            WorkTypeId = dto.WorkTypeId,
            Attachments = new List<OrderAttachment>()
        };

        // ... (Блок завантаження файлів без змін) ...
        if (dto.Files != null && dto.Files.Any())
        {
            var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "orders");
            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

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
        var order = await _context.Orders.Include(o => o.Proposals).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.ClientId != userId) throw new UnauthorizedAccessException("Ви не можете редагувати чуже замовлення");
        if (order.Status != OrderStatus.New) throw new InvalidOperationException("Замовлення вже в роботі.");
        if (order.Proposals.Any()) throw new InvalidOperationException("Не можна редагувати, є ставки.");

        order.Title = dto.Title;
        order.Description = dto.Description;
        order.IsNegotiable = dto.IsNegotiable;
        order.Price = dto.IsNegotiable ? null : dto.Price;
        
        // Перераховуємо попередні значення, якщо змінилась ціна
        if (!order.IsNegotiable && order.Price.HasValue)
        {
            order.PlatformCommission = order.Price.Value * CommissionRate;
            order.ExecutorPrice = order.Price.Value - order.PlatformCommission;
        }

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
            Comment = p.Comment,
            Status = p.Status.ToString(),
            ExecutorId = p.ExecutorId,
            // Перевіряємо на null, про всяк випадок
            ExecutorName = p.Executor != null ? $"{p.Executor.FirstName} {p.Executor.LastName}" : "Unknown", 
            // ExecutorAvatar = p.Executor?.AvatarPath (якщо буде таке поле)
        }).ToList();

        return proposalsDto;
    }
    
    // 2.3 ПРИЙНЯТИ ВИКОНАВЦЯ (ЗАМОРОЗКА КОШТІВ)
    public async Task AcceptExecutorAsync(Guid orderId, string clientId, Guid proposalId)
    {
        // Більше не потрібна транзакція з Wallet, це проста операція оновлення
        var order = await _context.Orders
            .Include(o => o.Proposals)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.ClientId != clientId) throw new UnauthorizedAccessException("Це не ваше замовлення");
        
        // Важливо: Ми дозволяємо вибрати виконавця, навіть якщо статус New, 
        // але ми НЕ переводимо в InProgress, поки не буде оплачена комісія.
        
        var proposal = order.Proposals.FirstOrDefault(p => p.Id == proposalId);
        if (proposal == null) throw new KeyNotFoundException("Пропозицію не знайдено");

        // 1. Фіксуємо суми
        decimal totalPrice = proposal.Price;
        decimal commission = Math.Round(totalPrice * CommissionRate, 2); // Округляємо до копійок
        decimal toExecutor = totalPrice - commission;

        // 2. Оновлюємо замовлення (підготовка до оплати)
        order.ExecutorId = proposal.ExecutorId;
        order.Price = totalPrice;
        order.PlatformCommission = commission;
        order.ExecutorPrice = toExecutor;
        order.IsCommissionPaid = false; // Ще не оплачено!
        
        // СТАТУС НЕ ЗМІНЮЄМО НА InProgress! 
        // Статус зміниться тільки після Webhook від WayForPay.
        // Можна залишити New або додати статус "WaitingForPayment".
        // Поки залишаємо New, але з заповненим ExecutorId.

        proposal.Status = ProposalStatus.Accepted;

        await _context.SaveChangesAsync();
        
        // 4.3 Системне сповіщення
        await _chatService.SendSystemMessageAsync(order.Id, "Виконавця обрано. Очікується оплата комісії.");
    }

    // 2.4 ЗАВЕРШИТИ ЗАМОВЛЕННЯ (ПЕРЕКАЗ КОШТІВ)
    public async Task CompleteOrderAsync(Guid orderId, string clientId)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.ClientId != clientId) throw new UnauthorizedAccessException("Немає прав");

        // Перевіряємо, чи можна завершити
        if (order.Status != OrderStatus.Review && order.Status != OrderStatus.InProgress)
            throw new InvalidOperationException("Замовлення не готове до завершення");

        // Більше немає переказу грошей (WalletTransaction).
        // Ми просто фіксуємо факт завершення. 
        // Припускаємо, що клієнт розрахувався з виконавцем напряму (карта/готівка),
        // або використовував функціонал DirectPaymentRequest (який варто перевірити тут, якщо суворо).
        
        order.Status = OrderStatus.Completed;

        // Тут можна відправити нотифікацію виконавцю: "Клієнт підтвердив виконання!"

        await _context.SaveChangesAsync();
        
        await _chatService.SendSystemMessageAsync(order.Id, "Замовлення виконано! Гроші перераховано виконавцю.");
    }

    // 2.5
    public async Task RequestRevisionAsync(Guid orderId, string clientId, string comment)
    {
        var order = await _context.Orders.Include(o => o.Chat).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new KeyNotFoundException();
        if (order.ClientId != clientId) throw new UnauthorizedAccessException();
        
        if (order.Status != OrderStatus.Review)
            throw new InvalidOperationException("Тільки статус 'Перевірка' дозволяє відправити на доопрацювання.");

        order.Status = OrderStatus.InProgress;

        if (order.Chat != null)
        {
            _context.ChatMessages.Add(new ChatMessage
            {
                ChatId = order.Chat.Id,
                SenderId = clientId,
                Text = $"[СИСТЕМА] Повернуто на доопрацювання. Коментар: {comment}",
                SentAt = DateTime.UtcNow,
                IsSystem = true
            });
        }
        await _context.SaveChangesAsync();
    }

    // 2.6 ВІДКРИТИ СПІР
    public async Task OpenDisputeAsync(Guid orderId, string clientId)
    {
        var order = await _context.Orders.Include(o => o.Chat).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new KeyNotFoundException();
        if (order.ClientId != clientId) throw new UnauthorizedAccessException();

        if (order.Status != OrderStatus.InProgress && order.Status != OrderStatus.Review)
            throw new InvalidOperationException("Неможливо відкрити спір.");

        order.Status = OrderStatus.Dispute;

        if (order.Chat != null)
        {
            order.Chat.IsManagerJoined = true;
            _context.ChatMessages.Add(new ChatMessage
            {
                ChatId = order.Chat.Id,
                SenderId = clientId,
                Text = "[СИСТЕМА] Відкрито Арбітраж. Менеджер приєднається найближчим часом.",
                SentAt = DateTime.UtcNow,
                IsSystem = true
            });
        }
        await _context.SaveChangesAsync();
    }
    
    
    public async Task LeaveReviewAsync(Guid orderId, string clientId, CreateReviewDto dto)
    {
        // 1. Шукаємо замовлення
        var order = await _context.Orders
            .Include(o => o.Review) // Перевіряємо, чи вже є відгук
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) 
            throw new KeyNotFoundException("Замовлення не знайдено");

        // 2. Валідація прав доступу
        if (order.ClientId != clientId) 
            throw new UnauthorizedAccessException("Ви не є замовником цього проєкту.");

        // 3. Валідація статусу (тільки завершені замовлення)
        if (order.Status != OrderStatus.Completed)
            throw new InvalidOperationException("Відгук можна залишити тільки після завершення замовлення.");

        // 4. Перевірка на дублікат
        if (order.Review != null)
            throw new InvalidOperationException("Ви вже залишили відгук для цього замовлення.");

        // 5. Перевірка наявності виконавця (технічно неможливо завершити без нього, але перевіримо)
        if (string.IsNullOrEmpty(order.ExecutorId))
            throw new InvalidOperationException("У замовлення немає виконавця.");

        // 6. Створення відгуку
        var review = new Review
        {
            Id = Guid.NewGuid(),
            Rating = dto.Rating,
            Text = dto.Text,
            CreatedAt = DateTime.UtcNow,
        
            OrderId = order.Id,
            AuthorId = clientId,           // Хто пише (Замовник)
            TargetUserId = order.ExecutorId // Кому пишуть (Виконавець)
        };

        _context.Reviews.Add(review);
    
        // (Опціонально) Тут можна перерахувати середній рейтинг юзера і зберегти його в AppUser, 
        // якщо ви додасте поле Rating в таблицю юзерів.
    
        await _context.SaveChangesAsync();
    }
    
    
    public async Task<PagedResult<OrderPreviewDto>> SearchOrdersAsync(SearchOrdersQuery query)
    {
        var dbQuery = _context.Orders
            .AsNoTracking()
            .Include(o => o.Discipline)
            .Include(o => o.WorkType)
            .Include(o => o.Client)
            .Where(o => o.Status == OrderStatus.New);

        // При пошуку важливо: якщо замовлення має статус New, але вже має ExecutorId (чекає оплати комісії),
        // його, мабуть, не варто показувати в пошуку для інших виконавців.
        dbQuery = dbQuery.Where(o => o.ExecutorId == null);

        if (query.DisciplineId.HasValue)
            dbQuery = dbQuery.Where(o => o.DisciplineId == query.DisciplineId.Value);

        if (query.WorkTypeId.HasValue)
            dbQuery = dbQuery.Where(o => o.WorkTypeId == query.WorkTypeId.Value);

        if (query.MinPrice.HasValue)
            dbQuery = dbQuery.Where(o => o.Price != null && o.Price >= query.MinPrice.Value);

        if (query.MaxPrice.HasValue)
            dbQuery = dbQuery.Where(o => o.Price != null && o.Price <= query.MaxPrice.Value);

        dbQuery = dbQuery.OrderByDescending(o => o.CreatedAt);

        var totalCount = await dbQuery.CountAsync();
        var items = await dbQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(o => new OrderPreviewDto
            {
                Id = o.Id,
                Title = o.Title,
                Price = o.Price,
                IsNegotiable = o.IsNegotiable,
                Deadline = o.Deadline,
                CreatedAt = o.CreatedAt,
                Status = o.Status.ToString(),
                DisciplineName = o.Discipline.Name,
                WorkTypeName = o.WorkType.Name,
                ClientName = $"{o.Client.FirstName} {o.Client.LastName}"
            })
            .ToListAsync();

        return new PagedResult<OrderPreviewDto>
        {
            Items = items,
            TotalCount = totalCount,
            CurrentPage = query.Page,
            PageSize = query.PageSize
        };
    }
}