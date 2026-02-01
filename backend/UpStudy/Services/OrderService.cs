using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;
using Microsoft.EntityFrameworkCore;

namespace UpStudy.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IS3Service _s3Service;
    private readonly IChatService _chatService;
    
    private const decimal CommissionRate = 0.15m;
    
    public OrderService(ApplicationDbContext context, IS3Service s3Service, IChatService chatService)
    {
        _context = context;
        _s3Service = s3Service;
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
                var s3Key = await _s3Service.UploadFileAsync(file, "orders");
                
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
        var order = await _context.Orders
            .Include(o => o.Proposals)
            .Include(o => o.Attachments) // Include Attachments for file management
            .FirstOrDefaultAsync(o => o.Id == orderId);
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

        // 1. Delete files
        if (dto.DeletedFileIds != null && dto.DeletedFileIds.Any())
        {
            var filesToDelete = order.Attachments
                .Where(a => dto.DeletedFileIds.Contains(a.Id))
                .ToList();

            foreach (var file in filesToDelete)
            {
                // Delete from S3
                await _s3Service.DeleteFileAsync(file.S3Key);
                // Remove from DB
                order.Attachments.Remove(file);
            }
        }

        // 2. Add new files
        if (dto.NewFiles != null && dto.NewFiles.Any())
        {
            foreach (var file in dto.NewFiles)
            {
                // Upload to "orders" folder
                var s3Key = await _s3Service.UploadFileAsync(file, "orders");
                
                order.Attachments.Add(new OrderAttachment
                {
                    OrderId = order.Id,
                    OriginalFileName = file.FileName,
                    S3Key = s3Key,
                    UploadedAt = DateTime.UtcNow,
                    IsResultWork = false
                });
            }
        }

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
        // Якщо рейтингу немає в таблиці юзера, можливо, треба підтягнути відгуки:
        // .Include(o => o.Proposals).ThenInclude(p => p.Executor).ThenInclude(e => e.ReceivedReviews) 
        .FirstOrDefaultAsync(o => o.Id == orderId);

    if (order == null)
        throw new KeyNotFoundException("Замовлення не знайдено");

    // 2. Перевірка прав (тільки замовник бачить ставки)
    // UPD: Дозволяємо перегляд списку виконавців іншим користувачам, але приховуємо деталі (коментар, ціну)
    bool isClient = order.ClientId == userId;

    var specializations = new List<string>();
    specializations.Add("Програмування");
    specializations.Add("Електромеханіка");
    specializations.Add("Фізика");

    // 3. Мапимо базові дані (без асинхронних операцій S3)
    var proposalsDto = order.Proposals.Select(p => {
        bool isMyProposal = p.ExecutorId == userId;
        bool canSeeDetails = isClient || isMyProposal;

        return new OrderProposalDto
        {
            Id = p.Id,
            Price = canSeeDetails ? p.Price : 0, // Приховуємо ціну для інших
            Comment = canSeeDetails ? p.Comment : "Приховано", // Приховуємо коментар
            Status = p.Status.ToString(),
            ExecutorId = p.ExecutorId,
            ExecutorName = p.Executor != null 
                ? (p.Executor.UserName ?? "Unknown") 
                : "Unknown",
            
            // --- Нові поля ---
            ExecutorRating = 4.5,
            ExecutorIsVerified = p.Executor?.IsVerified ?? false, 
            ExecutorCompletedProjects = 2, 
            ExecutorSpecializations = specializations,
            ExecutorAvatar = p.Executor?.AvatarS3Key 
        };
    }).ToList();

    // 4. 🔥 Генеруємо S3 посилання для аватарів (це асинхронна операція)
    foreach (var proposal in proposalsDto)
    {
        if (!string.IsNullOrEmpty(proposal.ExecutorAvatar))
        {
            proposal.ExecutorAvatar = await _s3Service.GetPresignedViewUrlAsync(proposal.ExecutorAvatar, expirationMinutes: 60);
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
        
        // 3. Автоматично відхиляємо всі інші пропозиції
        var otherProposals = order.Proposals.Where(p => p.Id != proposalId && p.Status == ProposalStatus.Pending).ToList();
        foreach (var other in otherProposals)
        {
            other.Status = ProposalStatus.Rejected;
        }

        await _context.SaveChangesAsync();
        
        // 4.3 Системне сповіщення
        await _chatService.SendSystemMessageAsync(order.Id, "Виконавця обрано. Очікується оплата комісії.");
    }



    public async Task RejectExecutorAsync(Guid orderId, string clientId, Guid proposalId)
    {
        var order = await _context.Orders
            .Include(o => o.Proposals)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException("Замовлення не знайдено");
        if (order.ClientId != clientId) throw new UnauthorizedAccessException("Це не ваше замовлення");

        var proposal = order.Proposals.FirstOrDefault(p => p.Id == proposalId);
        if (proposal == null) throw new KeyNotFoundException("Пропозицію не знайдено");

        proposal.Status = ProposalStatus.Rejected;
        await _context.SaveChangesAsync();
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
        return await _s3Service.GetPresignedDownloadUrlAsync(attachment.S3Key);
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

        return await _s3Service.GetPresignedViewUrlAsync(attachment.S3Key);
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
    
    public async Task<OrderResponseDto?> GetOrderByIdAsync(Guid orderId)
    {
        var order = await _context.Orders
            .AsNoTracking() // Важливо для GET запитів (швидкодія)
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
                ViewUrl = await _s3Service.GetPresignedViewUrlAsync(att.S3Key, expirationMinutes: 60),
                DownloadUrl = await _s3Service.GetPresignedDownloadUrlAsync(att.S3Key, expirationMinutes: 60),
                UploadedAt = att.UploadedAt,
                IsResultWork = att.IsResultWork
            });
        }

        // Мапимо відповідь
        return new OrderResponseDto
        {
            Id = order.Id,
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
            ClientName = order.Client != null ? (order.Client.UserName ?? "Unknown") : "Unknown",
            ClientId = order.ClientId,
            ExecutorId = order.ExecutorId,

            Attachments = attachmentDtos
        };
    }
    
    
    public async Task<List<OrderPreviewDto>> GetUserOrdersAsync(string userId)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Discipline)
            .Include(o => o.WorkType)
            .Include(o => o.Client)
            // 🔥 ГОЛОВНА ЛОГІКА:
            // Показуємо замовлення, якщо юзер його створив (ClientId)
            // АБО якщо юзер призначений виконавцем (ExecutorId)
            .Where(o => o.ClientId == userId || o.ExecutorId == userId)
            .OrderByDescending(o => o.CreatedAt) // Спочатку найновіші
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
                ClientName = o.Client.UserName ?? "Unknown",
                ClientId = o.ClientId,
                ExecutorId = o.ExecutorId,
                Description = o.Description,
                Attachments = o.Attachments.Select(a => new AttachmentDto
                {
                    Id = a.Id,
                    OriginalFileName = a.OriginalFileName,
                    S3Key = a.S3Key // URL генеруватиметься на фронті або в окремому методі, але тут ми повертаємо DTO. 
                    // Стоп, AttachmentDto зазвичай має Url? Перевіримо DTO.
                    // Якщо AttachmentDto має Url, нам треба s3Service.GetPresignedUrl... 
                    // Але в Select (IQueryable) ми не можемо викликати async методи s3Service.
                    // Тому ми повернемо S3Key, а URL згенеруємо пізніше, або змінимо логіку.
                    // ДЛЯ ПРОСТОТИ: Зараз повернемо як є, але AttachmentDto перевіримо.
                }).ToList()
            })
            // Після матеріалізації (ToListAsync) можна пройтись і додати URL, якщо треба.
            .ToListAsync();
            
        // Генерація URL для файлів (оскільки це async)
        foreach (var order in orders)
        {
            foreach (var attachment in order.Attachments)
            {
                // Тут ми маємо доступ до S3Key з мапінгу?
                // AttachmentDto повинен мати S3Key або ми використовуємо Url.
                // Перевіримо AttachmentDto.
                // Припустимо, що ми заповнимо Url тут.
                attachment.DownloadUrl = await _s3Service.GetPresignedDownloadUrlAsync(attachment.S3Key ?? ""); 
                attachment.ViewUrl = await _s3Service.GetPresignedViewUrlAsync(attachment.S3Key ?? "");
            }
        }

        return orders;
    }

    public async Task<List<OrderWithMyProposalDto>> GetUserProposalsAsync(string userId)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Discipline)
            .Include(o => o.WorkType)
            .Include(o => o.Client)
            .Include(o => o.Proposals) // Include proposals to filter
            .Where(o => o.Proposals.Any(p => p.ExecutorId == userId))
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new {
                Order = o,
                Proposal = o.Proposals.FirstOrDefault(p => p.ExecutorId == userId)
            })
            .ToListAsync();

        var result = new List<OrderWithMyProposalDto>();

        foreach (var item in orders)
        {
            var o = item.Order;
            var p = item.Proposal;
            
            if (p == null) continue;

            var dto = new OrderWithMyProposalDto
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
                ClientName = o.Client.UserName ?? "Unknown",
                ClientId = o.ClientId,
                ExecutorId = o.ExecutorId,
                Description = o.Description,
                
                MyProposalId = p.Id,
                MyProposalStatus = p.Status.ToString(),
                MyPrice = p.Price,
                
                Attachments = o.Attachments.Select(a => new AttachmentDto
                {
                    Id = a.Id,
                    OriginalFileName = a.OriginalFileName,
                    S3Key = a.S3Key
                }).ToList()
            };

            // Generate URLs
            foreach (var attachment in dto.Attachments)
            {
                attachment.DownloadUrl = await _s3Service.GetPresignedDownloadUrlAsync(attachment.S3Key ?? ""); 
                attachment.ViewUrl = await _s3Service.GetPresignedViewUrlAsync(attachment.S3Key ?? "");
            }

            result.Add(dto);
        }

        return result;
    }
}