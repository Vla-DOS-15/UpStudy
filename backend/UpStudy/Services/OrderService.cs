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
        // Починаємо транзакцію БД
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var order = await _context.Orders
                .Include(o => o.Proposals)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
            if (order.ClientId != clientId) throw new UnauthorizedAccessException("Це не ваше замовлення");
            if (order.Status != OrderStatus.New) throw new InvalidOperationException("Замовлення вже не нове");

            var proposal = order.Proposals.FirstOrDefault(p => p.Id == proposalId);
            if (proposal == null) throw new KeyNotFoundException("Пропозицію не знайдено");

            // 1. Отримуємо гаманець клієнта
            var clientWallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == clientId);

            if (clientWallet == null) 
                throw new InvalidOperationException("Гаманець користувача не знайдено (зверніться в підтримку).");

            decimal price = proposal.Price;

            // 2. Перевірка балансу
            if (clientWallet.Balance < price)
                throw new InvalidOperationException($"Недостатньо коштів. Потрібно {price}, на балансі {clientWallet.Balance}.");

            // 3. Змінюємо баланс (Логіка Холду)
            clientWallet.Balance -= price;
            clientWallet.FrozenBalance += price;

            // 4. Пишемо лог транзакції
            _context.WalletTransactions.Add(new WalletTransaction
            {
                WalletId = clientWallet.Id,
                Amount = -price, // Списання з доступного
                Type = TransactionType.HoldForOrder,
                OrderId = order.Id,
                Description = $"Заморозка коштів під замовлення '{order.Title}'",
                CreatedAt = DateTime.UtcNow
            });

            // 5. Оновлюємо замовлення
            order.ExecutorId = proposal.ExecutorId;
            order.Price = price; // Фіксуємо фінальну ціну
            order.Status = OrderStatus.InProgress;
            proposal.Status = ProposalStatus.Accepted;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync(); // Підтверджуємо все
        }
        catch
        {
            await transaction.RollbackAsync(); // Відкочуємо все при помилці
            throw;
        }
    }

    // 2.4 ЗАВЕРШИТИ ЗАМОВЛЕННЯ (ПЕРЕКАЗ КОШТІВ)
    public async Task CompleteOrderAsync(Guid orderId, string clientId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var order = await _context.Orders
                .Include(o => o.Client).ThenInclude(c => c.Wallet) // Гаманець клієнта
                .Include(o => o.Executor).ThenInclude(e => e.Wallet) // Гаманець виконавця
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
            if (order.ClientId != clientId) throw new UnauthorizedAccessException("Немає прав");
            
            // Дозволяємо завершувати зі статусу Review (або InProgress, якщо є довіра)
            if (order.Status != OrderStatus.Review && order.Status != OrderStatus.InProgress)
                throw new InvalidOperationException("Замовлення не готове до завершення");

            if (order.Executor?.Wallet == null || order.Client?.Wallet == null)
                throw new InvalidOperationException("Проблема з гаманцями учасників");

            decimal amount = order.Price ?? 0;
            if (amount <= 0) throw new InvalidOperationException("Ціна замовлення некоректна");

            // 1. Розморожуємо гроші клієнта (списуємо їх остаточно)
            if (order.Client.Wallet.FrozenBalance < amount)
                throw new InvalidOperationException("Помилка цілісності: заморожений баланс менший за суму замовлення.");

            order.Client.Wallet.FrozenBalance -= amount;

            // 2. Нараховуємо гроші виконавцю
            // (Тут можна додати комісію платформи, наприклад 10%)
            decimal commission = amount * 0.10m; 
            decimal toExecutor = amount - commission;

            order.Executor.Wallet.Balance += toExecutor;

            // 3. Пишемо лог транзакції (Виконавцю)
            _context.WalletTransactions.Add(new WalletTransaction
            {
                WalletId = order.Executor.Wallet.Id,
                Amount = toExecutor,
                Type = TransactionType.ReleaseToExecutor,
                OrderId = order.Id,
                Description = $"Зарахування за замовлення '{order.Title}' (комісія {commission})",
                CreatedAt = DateTime.UtcNow
            });

            // 4. Оновлюємо статус
            order.Status = OrderStatus.Completed;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // 2.5 НА ДООПРАЦЮВАННЯ
    public async Task RequestRevisionAsync(Guid orderId, string clientId, string comment)
    {
        var order = await _context.Orders
            .Include(o => o.Chat)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException();
        if (order.ClientId != clientId) throw new UnauthorizedAccessException();
        
        if (order.Status != OrderStatus.Review)
            throw new InvalidOperationException("Тільки статус 'Перевірка' дозволяє відправити на доопрацювання.");

        order.Status = OrderStatus.InProgress;

        // Додаємо системне повідомлення в чат
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
        var order = await _context.Orders
            .Include(o => o.Chat)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException();
        if (order.ClientId != clientId) throw new UnauthorizedAccessException();

        if (order.Status != OrderStatus.InProgress && order.Status != OrderStatus.Review)
            throw new InvalidOperationException("Неможливо відкрити спір на цьому етапі.");

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
        // 1. Початковий запит (тільки нові замовлення)
        // AsNoTracking() пришвидшує читання, бо нам не треба відстежувати зміни
        var dbQuery = _context.Orders
            .AsNoTracking()
            .Include(o => o.Discipline)
            .Include(o => o.WorkType)
            .Include(o => o.Client)
            .Where(o => o.Status == OrderStatus.New);

        // 2. Застосування фільтрів (динамічно)
        
        if (query.DisciplineId.HasValue)
        {
            dbQuery = dbQuery.Where(o => o.DisciplineId == query.DisciplineId.Value);
        }

        if (query.WorkTypeId.HasValue)
        {
            dbQuery = dbQuery.Where(o => o.WorkTypeId == query.WorkTypeId.Value);
        }

        if (query.MinPrice.HasValue)
        {
            // Враховуємо, що Price може бути null (якщо договірна), тому фільтруємо тільки там, де є ціна
            dbQuery = dbQuery.Where(o => o.Price != null && o.Price >= query.MinPrice.Value);
        }

        if (query.MaxPrice.HasValue)
        {
            dbQuery = dbQuery.Where(o => o.Price != null && o.Price <= query.MaxPrice.Value);
        }

        // 3. Сортування (спочатку найсвіжіші)
        dbQuery = dbQuery.OrderByDescending(o => o.CreatedAt);

        // 4. Пагінація
        var totalCount = await dbQuery.CountAsync(); // Рахуємо загальну кількість ДО пагінації
        
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

        // 5. Повертаємо результат
        return new PagedResult<OrderPreviewDto>
        {
            Items = items,
            TotalCount = totalCount,
            CurrentPage = query.Page,
            PageSize = query.PageSize
        };
    }
}