using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;
using Microsoft.EntityFrameworkCore;

namespace UpStudy.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IR2Service _r2Service;
    private readonly IChatService _chatService;
    
    private const decimal CommissionRate = 0.15m;
    
    public OrderService(ApplicationDbContext context, IR2Service r2Service, IChatService chatService)
    {
        _context = context;
        _r2Service = r2Service;
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

        // Завантаження файлів в S3
        if (dto.Files != null && dto.Files.Any())
        {
            foreach (var file in dto.Files)
            {
                // Завантажуємо в папку "orders"
                var s3Key = await _r2Service.UploadFileAsync(file, "orders");
                
                order.Attachments.Add(new OrderAttachment
                {
                    OrderId = order.Id,
                    OriginalFileName = file.FileName,
                    S3Key = s3Key,  // Зберігаємо S3 ключ
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

    public async Task DeleteOrderAsync(Guid id, string userId)
    {
        var order = await _context.Orders.Include(o => o.Proposals).FirstOrDefaultAsync(o => o.Id == id);
        
        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        
        if (order.ClientId != userId) 
            throw new UnauthorizedAccessException("Ви не можете видалити чуже замовлення");
            
        if (order.Status != OrderStatus.New) 
            throw new InvalidOperationException("Можна видаляти тільки нові замовлення. Це замовлення вже в роботі або завершене.");

        // Можна також перевіряти наявність ставок, якщо видалення заборонено при ставках:
        // if (order.Proposals.Any()) throw new InvalidOperationException("Не можна видалити замовлення, на яке вже є ставки.");
        // Але ТЗ цього не вимагало строго, проте логічно дозволити видалити, якщо ще нікого не обрано.
        // Якщо є ставки, вони каскадно видаляться або залишаться? 
        // Припустимо, що видаляємо все.

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();
    }

public async Task<List<OrderProposalDto>> GetProposalsForOrderAsync(Guid orderId, string userId)
{
    // 1. Шукаємо замовлення та підтягуємо всі зв'язки
    var order = await _context.Orders
        .Include(o => o.Proposals)
            .ThenInclude(p => p.Executor)
                .ThenInclude(e => e.PreferredDisciplines)
        .FirstOrDefaultAsync(o => o.Id == orderId);

    if (order == null)
        throw new KeyNotFoundException("Замовлення не знайдено");

    // 2. Перевірка прав (клієнт бачить всі, виконавець - тільки свою)
    var isClient = order.ClientId == userId;
    var proposalsList = order.Proposals.AsEnumerable();

    if (!isClient)
    {
        var myProposals = proposalsList.Where(p => p.ExecutorId == userId).ToList();
        proposalsList = myProposals;
    }

    // 3. Мапимо базові дані (без асинхронних операцій S3)
    var proposalsDto = proposalsList.Select(p => new OrderProposalDto
    {
        Id = p.Id,
        Price = p.Price,
        Comment = p.Comment,
        Status = p.Status.ToString(),
        ExecutorId = p.ExecutorId,
        ExecutorName = p.Executor != null 
            ? $"{p.Executor.FirstName} {p.Executor.LastName}" 
            : "Невідомий",
        
        // --- Нові поля ---
        ExecutorRating = p.Executor?.Rating ?? 0, 
        ExecutorIsVerified = p.Executor?.IsVerified ?? false, 
        
        ExecutorCompletedProjects = p.Executor?.CompletedOrdersCount ?? 0, 

        // Мапимо спеціалізації (якщо це окрема сутність)
        ExecutorSpecializations = p.Executor?.PreferredDisciplines?.Select(d => d.Name).ToList() ?? new List<string>(),

        // Тимчасово записуємо ключ (шлях) до файлу, URL згенеруємо нижче
        ExecutorAvatar = p.Executor?.AvatarS3Key 
    }).ToList();

    // 4. 🔥 Генеруємо S3 посилання для аватарів (це асинхронна операція)
    // Якщо у вас аватари це просто публічні URL, цей крок можна пропустити
    foreach (var proposal in proposalsDto)
    {
        if (!string.IsNullOrEmpty(proposal.ExecutorAvatar))
        {
            // Генеруємо Presigned URL на 60 хвилин
            // Якщо proposal.ExecutorAvatar вже є посиланням (http...), то метод GetPresignedViewUrlAsync має це враховувати і повертати як є
            proposal.ExecutorAvatar = await _r2Service.GetPresignedViewUrlAsync(proposal.ExecutorAvatar, expirationMinutes: 60);
        }
    }

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
        
        if (!string.IsNullOrEmpty(order.ExecutorId))
        {
            var executor = await _context.Users.FindAsync(order.ExecutorId);
            if (executor != null)
            {
                executor.CompletedOrdersCount += 1;
            }
        }

        await _context.SaveChangesAsync();
        
        await _chatService.SendSystemMessageAsync(order.Id, "Замовлення виконано! Гроші перераховано виконавцю.");
    }

    // 2.5
    public async Task RequestRevisionAsync(Guid orderId, string clientId, string comment)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new KeyNotFoundException();
        if (order.ClientId != clientId) throw new UnauthorizedAccessException();
        
        if (order.Status != OrderStatus.Review)
            throw new InvalidOperationException("Тільки статус 'Перевірка' дозволяє відправити на доопрацювання.");

        order.Status = OrderStatus.InProgress;
        await _context.SaveChangesAsync();
        
        await _chatService.SendSystemMessageAsync(order.Id, $"Повернуто на доопрацювання. Коментар: {comment}");
    }

    // 2.6 ВІДКРИТИ СПІР
    public async Task OpenDisputeAsync(Guid orderId, string clientId)
    {
        // Include Chats to set IsManagerJoined if needed
        var order = await _context.Orders.Include(o => o.Chats).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new KeyNotFoundException();
        if (order.ClientId != clientId) throw new UnauthorizedAccessException();

        if (order.Status != OrderStatus.InProgress && order.Status != OrderStatus.Review)
            throw new InvalidOperationException("Неможливо відкрити спір.");

        order.Status = OrderStatus.Dispute;

        // Try to find the chat with the active executor
        var activeChat = order.Chats.FirstOrDefault(c => c.ParticipantId == order.ExecutorId);
        if (activeChat != null)
        {
            activeChat.IsManagerJoined = true;
        }

        await _context.SaveChangesAsync();
        
        await _chatService.SendSystemMessageAsync(order.Id, "Відкрито Арбітраж. Менеджер приєднається найближчим часом.");
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
    
        // Перерахунок рейтингу
        var executor = await _context.Users.FindAsync(order.ExecutorId);
        if (executor != null)
        {
            var previousReviews = await _context.Reviews
                .Where(r => r.TargetUserId == order.ExecutorId)
                .Select(r => (double)r.Rating)
                .ToListAsync();
                
            previousReviews.Add(dto.Rating);
            executor.Rating = previousReviews.Average();
        }
    
        await _context.SaveChangesAsync();
    }
    
    
    public async Task<PagedResult<OrderPreviewDto>> SearchOrdersAsync(SearchOrdersQuery query, string? currentUserId)
    {
        var dbQuery = _context.Orders
            .Include(o => o.Proposals)
            .Include(o => o.Discipline)
            .Include(o => o.WorkType)
            .Include(o => o.Client)
            .Where(o => o.Status == OrderStatus.New);

        // При пошуку важливо: якщо замовлення має статус New, але вже має ExecutorId (чекає оплати комісії),
        // його, мабуть, не варто показувати в пошуку для інших виконавців.
        dbQuery = dbQuery.Where(o => o.ExecutorId == null);

        // Фільтруємо замовлення, на які виконавець вже подав заявку
        if (!string.IsNullOrEmpty(currentUserId))
        {
            dbQuery = dbQuery.Where(o => !o.Proposals.Any(p => p.ExecutorId == currentUserId));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(o => 
                o.Title.ToLower().Contains(search) || 
                o.Description.ToLower().Contains(search));
        }

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
                OrderNumber = o.OrderNumber,
                Title = o.Title,
                Price = o.Price,
                IsNegotiable = o.IsNegotiable,
                Deadline = o.Deadline,
                CreatedAt = o.CreatedAt,
                Status = o.Status.ToString(),
                DisciplineName = o.Discipline.Name,
                WorkTypeName = o.WorkType.Name,
                ClientName = $"{o.Client.FirstName} {o.Client.LastName}",
                ClientId = o.ClientId,
                ExecutorId = o.ExecutorId,
                HasMyProposal = false, // Because they are filtered out
                MyProposalId = null
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
    
    public async Task<string> GetFileDownloadUrlAsync(Guid attachmentId, string userId, bool isAdmin = false)
    {
        var attachment = await _context.OrderAttachments
            .Include(a => a.Order)
            .FirstOrDefaultAsync(a => a.Id == attachmentId);

        if (attachment == null)
            throw new KeyNotFoundException("Файл не знайдено");

        var order = attachment.Order;
        
        // Перевірка доступу
        bool hasAccess = order.ClientId == userId || order.ExecutorId == userId;
        
        // Якщо це результат роботи - тільки замовник та виконавець можуть завантажити
        if (attachment.IsResultWork)
        {
            if (!hasAccess && !isAdmin)
                throw new UnauthorizedAccessException("Немає доступу до результату роботи");
        }
        else
        {
            // Звичайні файли замовлення доступні всім (для перегляду замовлення)
            // Але якщо хочете обмежити - додайте перевірку
        }

        // Генеруємо presigned URL (дійсний 1 годину)
        return await _r2Service.GetPresignedDownloadUrlAsync(attachment.S3Key);
    }
    
    public async Task<string> GetFileViewUrlAsync(Guid attachmentId, string userId, bool isAdmin = false)
    {
        var attachment = await _context.OrderAttachments
            .Include(a => a.Order)
            .FirstOrDefaultAsync(a => a.Id == attachmentId);

        if (attachment == null)
            throw new KeyNotFoundException("Файл не знайдено");

        var order = attachment.Order;
        bool hasAccess = order.ClientId == userId || order.ExecutorId == userId;
        
        if (attachment.IsResultWork && !hasAccess && !isAdmin)
            throw new UnauthorizedAccessException("Немає доступу");

        return await _r2Service.GetPresignedViewUrlAsync(attachment.S3Key);
    }
    

    public async Task SubmitForReviewAsync(Guid orderId, string executorId)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
    
        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.ExecutorId != executorId) throw new UnauthorizedAccessException("Ви не виконавець цього замовлення");
    
        if (order.Status != OrderStatus.InProgress)
            throw new InvalidOperationException("Здати роботу можна тільки зі статусу 'В роботі'.");

        order.Status = OrderStatus.Review;
        await _context.SaveChangesAsync();
    
        // Системне повідомлення в чат
        await _chatService.SendSystemMessageAsync(order.Id, "✅ Виконавець позначив роботу як виконану. Очікується перевірка замовником.");
    }
    
    public async Task<OrderResponseDto?> GetOrderByIdAsync(Guid orderId, string? currentUserId = null)
    {
        var order = await _context.Orders
            .AsNoTracking() // Важливо для GET запитів (швидкодія)
            .Include(o => o.Proposals)
            .Include(o => o.Client)
            .Include(o => o.Discipline)
            .Include(o => o.WorkType)
            .Include(o => o.Attachments)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return null;

        // Формуємо список файлів з посиланнями
        var attachmentDtos = new List<AttachmentDto>();
        foreach (var att in order.Attachments)
        {
            attachmentDtos.Add(new AttachmentDto
            {
                Id = att.Id,
                OriginalFileName = att.OriginalFileName,
                // Генеруємо тимчасові посилання (на 60 хвилин)
                ViewUrl = await _r2Service.GetPresignedViewUrlAsync(att.S3Key, expirationMinutes: 60),
                DownloadUrl = await _r2Service.GetPresignedDownloadUrlAsync(att.S3Key, expirationMinutes: 60),
                UploadedAt = att.UploadedAt,
                IsResultWork = att.IsResultWork
            });
        }

            var myProposal = string.IsNullOrEmpty(currentUserId) ? null : order.Proposals.FirstOrDefault(p => p.ExecutorId == currentUserId);

            // Мапимо відповідь
            return new OrderResponseDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Title = order.Title,
                Description = order.Description,
                Price = order.Price,
                IsNegotiable = order.IsNegotiable,
                Deadline = order.Deadline,
                CreatedAt = order.CreatedAt,
                Status = order.Status.ToString(),
            
                DisciplineId = order.DisciplineId,
                DisciplineName = order.Discipline?.Name ?? "Не вказано",
                WorkTypeId = order.WorkTypeId,
                WorkTypeName = order.WorkType?.Name ?? "Не вказано",
                ClientName = order.Client != null ? $"{order.Client.FirstName} {order.Client.LastName}" : "Невідомий",
                ClientId = order.ClientId,
                ExecutorId = order.ExecutorId,

                IsCommissionPaid = order.IsCommissionPaid,
                PlatformCommission = order.PlatformCommission,
                CommissionPaymentStatus = order.CommissionPaymentStatus,
                CommissionRejectReason = order.CommissionRejectReason,

                Attachments = attachmentDtos,
                HasMyProposal = myProposal != null,
                MyProposalId = myProposal?.Id
            };
    }
    
    public async Task<PagedResult<OrderPreviewDto>> GetPendingOrdersAsync(string userId, SearchOrdersQuery query)
    {
        var dbQuery = _context.Orders
            .AsNoTracking()
            .Include(o => o.Discipline)
            .Include(o => o.WorkType)
            .Include(o => o.Client)
            .Include(o => o.Proposals)
            .Where(o => o.Status == OrderStatus.New 
                        && o.ExecutorId == null 
                        && o.Proposals.Any(p => p.ExecutorId == userId && p.Status == ProposalStatus.Pending));

        if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<OrderStatus>(query.Status, true, out var statusEnum))
        {
            dbQuery = dbQuery.Where(o => o.Status == statusEnum);
        }

        var totalCount = await dbQuery.CountAsync();

        var items = await dbQuery
            .OrderByDescending(o => o.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(o => new OrderPreviewDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                Title = o.Title,
                Price = o.Price,
                IsNegotiable = o.IsNegotiable,
                Deadline = o.Deadline,
                CreatedAt = o.CreatedAt,
                Status = o.Status.ToString(),
                DisciplineName = o.Discipline.Name,
                WorkTypeName = o.WorkType.Name,
                ClientName = $"{o.Client.FirstName} {o.Client.LastName}",
                ClientId = o.ClientId,
                ExecutorId = o.ExecutorId,
                HasMyProposal = true,
                MyProposalId = o.Proposals.Where(p => p.ExecutorId == userId).Select(p => (Guid?)p.Id).FirstOrDefault()
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

    public async Task<PagedResult<OrderPreviewDto>> GetArchivedOrdersAsync(string userId, SearchOrdersQuery query)
    {
        var dbQuery = _context.Orders
            .AsNoTracking()
            .Include(o => o.Discipline)
            .Include(o => o.WorkType)
            .Include(o => o.Client)
            .Include(o => o.Proposals)
            .Where(o => o.Proposals.Any(p => p.ExecutorId == userId) && 
                        (o.Proposals.Any(p => p.ExecutorId == userId && p.Status == ProposalStatus.Rejected) || 
                         (o.ExecutorId != null && o.ExecutorId != userId)));

        if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<OrderStatus>(query.Status, true, out var statusEnum))
        {
            dbQuery = dbQuery.Where(o => o.Status == statusEnum);
        }

        var totalCount = await dbQuery.CountAsync();

        var items = await dbQuery
            .OrderByDescending(o => o.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(o => new OrderPreviewDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                Title = o.Title,
                Price = o.Price,
                IsNegotiable = o.IsNegotiable,
                Deadline = o.Deadline,
                CreatedAt = o.CreatedAt,
                Status = o.Status.ToString(),
                DisciplineName = o.Discipline.Name,
                WorkTypeName = o.WorkType.Name,
                ClientName = $"{o.Client.FirstName} {o.Client.LastName}",
                ClientId = o.ClientId,
                ExecutorId = o.ExecutorId,
                HasMyProposal = true,
                MyProposalId = o.Proposals.Where(p => p.ExecutorId == userId).Select(p => (Guid?)p.Id).FirstOrDefault()
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
    
    
    public async Task<PagedResult<OrderPreviewDto>> GetUserOrdersAsync(string userId, SearchOrdersQuery query)
    {
        var dbQuery = _context.Orders
            .AsNoTracking()
            .Include(o => o.Discipline)
            .Include(o => o.WorkType)
            .Include(o => o.Client)
            // 🔥 ГОЛОВНА ЛОГІКА:
            // Показуємо замовлення, якщо юзер його створив (ClientId)
            // АБО якщо юзер призначений виконавцем (ExecutorId)
            .Where(o => o.ClientId == userId || o.ExecutorId == userId);

        if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<OrderStatus>(query.Status, true, out var statusEnum))
        {
            dbQuery = dbQuery.Where(o => o.Status == statusEnum);
        }

        var totalCount = await dbQuery.CountAsync();

        var items = await dbQuery
            .OrderByDescending(o => o.CreatedAt) // Спочатку найновіші
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(o => new OrderPreviewDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                Title = o.Title,
                Price = o.Price,
                IsNegotiable = o.IsNegotiable,
                Deadline = o.Deadline,
                CreatedAt = o.CreatedAt,
                Status = o.Status.ToString(),
                DisciplineName = o.Discipline.Name,
                WorkTypeName = o.WorkType.Name,
                ClientName = $"{o.Client.FirstName} {o.Client.LastName}",
                ClientId = o.ClientId,
                ExecutorId = o.ExecutorId,
                HasMyProposal = o.ExecutorId == userId,
                MyProposalId = null // Ми можемо не мати доступу до Proposals тут, але для UserOrders це зазвичай не потрібно для видалення
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

    public async Task UploadCommissionReceiptAsync(Guid orderId, string clientId, IFormFile file)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.ClientId != clientId) throw new UnauthorizedAccessException("Ви не замовник цього проєкту");
        if (order.ExecutorId == null) throw new InvalidOperationException("Спочатку оберіть виконавця");
        if (order.IsCommissionPaid) throw new InvalidOperationException("Комісія вже оплачена");

        if (file == null || file.Length == 0) throw new ArgumentException("Файл порожній");

        var s3Key = await _r2Service.UploadFileAsync(file, "commission-receipts");

        // Delete old receipt if exists (optional, could just keep it for history)
        // if (!string.IsNullOrEmpty(order.CommissionReceiptS3Key)) await _r2Service.DeleteFileAsync(order.CommissionReceiptS3Key);

        order.CommissionReceiptS3Key = s3Key;
        order.CommissionPaymentStatus = CommissionPaymentStatus.Submitted;
        order.CommissionRejectReason = null;

        await _context.SaveChangesAsync();
        await _chatService.SendSystemMessageAsync(order.Id, "Клієнт відправив квитанцію про оплату. Очікується перевірка адміністратором.");
    }

    public async Task<List<PendingCommissionDto>> GetPendingCommissionPaymentsAsync()
    {
        var orders = await _context.Orders
            .Include(o => o.Client)
            .Where(o => o.CommissionPaymentStatus == CommissionPaymentStatus.Submitted)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync();

        var result = new List<PendingCommissionDto>();
        foreach (var o in orders)
        {
            var viewUrl = !string.IsNullOrEmpty(o.CommissionReceiptS3Key) 
                ? await _r2Service.GetPresignedViewUrlAsync(o.CommissionReceiptS3Key)
                : string.Empty;

            result.Add(new PendingCommissionDto
            {
                OrderId = o.Id,
                OrderTitle = o.Title,
                CommissionAmount = o.PlatformCommission,
                ClientId = o.ClientId,
                ClientName = $"{o.Client.FirstName} {o.Client.LastName}",
                ReceiptViewUrl = viewUrl
            });
        }
        return result;
    }

    public async Task ApproveCommissionAsync(Guid orderId)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.CommissionPaymentStatus != CommissionPaymentStatus.Submitted) throw new InvalidOperationException("Замовлення не очікує перевірки комісії");

        order.CommissionPaymentStatus = CommissionPaymentStatus.Approved;
        order.IsCommissionPaid = true;
        order.Status = OrderStatus.InProgress;

        await _context.SaveChangesAsync();
        await _chatService.SendSystemMessageAsync(order.Id, "Оплату комісії підтверджено! Замовлення переведено в статус 'В роботі'.");
    }

    public async Task RejectCommissionAsync(Guid orderId, string reason)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.CommissionPaymentStatus != CommissionPaymentStatus.Submitted) throw new InvalidOperationException("Замовлення не очікує перевірки комісії");

        order.CommissionPaymentStatus = CommissionPaymentStatus.Rejected;
        order.CommissionRejectReason = reason;

        await _context.SaveChangesAsync();
        await _chatService.SendSystemMessageAsync(order.Id, $"Оплату комісії відхилено. Причина: {reason}. Будь ласка, завантажте коректну квитанцію.");
    }
}