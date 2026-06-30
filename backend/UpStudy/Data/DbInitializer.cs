using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpStudy.Models;

namespace UpStudy.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Застосовуємо міграції, якщо база ще не створена
        await context.Database.MigrateAsync();

        // Перевірка: якщо вже є користувачі, значить база не порожня -> виходимо
        if (await context.Users.AnyAsync()) return;

        // ==========================================
        // 1. СТВОРЕННЯ РОЛЕЙ
        // ==========================================
        string[] roles = { "Admin", "Client", "Executor" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // ==========================================
        // 2. СТВОРЕННЯ ЮЗЕРІВ
        // ==========================================
        
        // --- 2.1 Адмін ---
        var adminUser = new AppUser
        {
            UserName = "admin@upstudy.com",
            Email = "admin@upstudy.com",
            FirstName = "System",
            LastName = "Admin",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(adminUser, "Test1!");
        await userManager.AddToRoleAsync(adminUser, "Admin");

        // --- 2.2 Клієнт (Замовник) ---
        var clientUser = new AppUser
        {
            UserName = "client@test.com",
            Email = "client@test.com",
            FirstName = "Іван",
            LastName = "Клієнко",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(clientUser, "Test1!"); // Пароль
        await userManager.AddToRoleAsync(clientUser, "Client");

        // --- 2.3 Виконавець ---
        var executorUser = new AppUser
        {
            UserName = "dev@test.com",
            Email = "dev@test.com",
            FirstName = "Петро",
            LastName = "Кодер",
            EmailConfirmed = true,
            BankCardNumber = "4441111122223333", // Для тестів оплати
            IsFop = true,
            AboutMe = "Full-stack розробник, пишу на C# та JS."
        };
        await userManager.CreateAsync(executorUser, "Test1!");
        await userManager.AddToRoleAsync(executorUser, "Executor");

        // ==========================================
        // 3. ДОВІДНИКИ (Dictionaries)
        // ==========================================
        
        // Напрямки
        var dirIT = new Direction { Name = "Інформаційні технології" };
        var dirEcon = new Direction { Name = "Економіка" };
        var dirLaw = new Direction { Name = "Право" };
        context.Directions.AddRange(dirIT, dirEcon, dirLaw);
        await context.SaveChangesAsync(); // Зберігаємо, щоб отримати ID

        // Дисципліни
        var discCSharp = new Discipline { Name = "Програмування C#", DirectionId = dirIT.Id };
        var discWeb = new Discipline { Name = "Web Technologies", DirectionId = dirIT.Id };
        var discMicro = new Discipline { Name = "Мікроекономіка", DirectionId = dirEcon.Id };
        context.Disciplines.AddRange(discCSharp, discWeb, discMicro);

        // Типи робіт
        var typeLab = new WorkType { Name = "Лабораторна робота" };
        var typeCourse = new WorkType { Name = "Курсова робота" };
        var typeDiploma = new WorkType { Name = "Диплом" };
        context.WorkTypes.AddRange(typeLab, typeCourse, typeDiploma);
        
        await context.SaveChangesAsync();

        // ==========================================
        // 4. ЗАМОВЛЕННЯ (Orders)
        // ==========================================

        // --- Замовлення 1: НОВЕ (чекає виконавця) ---
        var orderNew = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Написати API для магазину",
            Description = "Потрібно зробити бекенд на ASP.NET Core. 3 контролери.",
            Price = 2000,
            ExecutorPrice = 1700,
            PlatformCommission = 300,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discCSharp.Id,
            WorkTypeId = typeCourse.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 2: В РОБОТІ (Виконавець вже взяв) ---
        var orderProgress = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Верстка сайту React",
            Description = "Адаптивна верстка за макетом Figma.",
            Price = 5000,
            ExecutorPrice = 4250,
            PlatformCommission = 750,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Status = OrderStatus.InProgress, // Вже в роботі
            ClientId = clientUser.Id,
            ExecutorId = executorUser.Id, // Виконавець призначений
            DisciplineId = discWeb.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = true // Комісія оплачена
        };

        // --- Замовлення 3: НОВЕ ---
        var order3 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Розробка мобільного додатку (React Native)",
            Description = "Потрібно створити простий додаток для обліку витрат. Дизайн є.",
            Price = 4000,
            ExecutorPrice = 3400,
            PlatformCommission = 600,
            IsNegotiable = true,
            Deadline = DateTime.UtcNow.AddDays(14),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discWeb.Id,
            WorkTypeId = typeCourse.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 4: НОВЕ ---
        var order4 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Дослідження ринку (Мікроекономіка)",
            Description = "Зробити аналіз ринку кави у Києві. 10 сторінок.",
            Price = 800,
            ExecutorPrice = 680,
            PlatformCommission = 120,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(5),
            CreatedAt = DateTime.UtcNow.AddHours(-10),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discMicro.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 5: НОВЕ ---
        var order5 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Telegram бот на C#",
            Description = "Бот для техпідтримки. Повинен приймати заявки та зберігати в БД.",
            Price = 1500,
            ExecutorPrice = 1275,
            PlatformCommission = 225,
            IsNegotiable = true,
            Deadline = DateTime.UtcNow.AddDays(10),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discCSharp.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 6: В РОБОТІ ---
        var order6 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Диплом з мікроекономіки",
            Description = "Тема: Вплив інфляції на малий бізнес. 60 сторінок.",
            Price = 12000,
            ExecutorPrice = 10200,
            PlatformCommission = 1800,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            Status = OrderStatus.InProgress,
            ClientId = clientUser.Id,
            ExecutorId = executorUser.Id,
            DisciplineId = discMicro.Id,
            WorkTypeId = typeDiploma.Id,
            IsCommissionPaid = true
        };

        // --- Замовлення 7: НОВЕ ---
        var order7 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Створення лендінгу (HTML/CSS/JS)",
            Description = "Верстка односторінкового сайту для барбершопу.",
            Price = 2500,
            ExecutorPrice = 2125,
            PlatformCommission = 375,
            IsNegotiable = true,
            Deadline = DateTime.UtcNow.AddDays(4),
            CreatedAt = DateTime.UtcNow.AddHours(-2),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discWeb.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 8: ВИКОНАНО ---
        var order8 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Калькулятор на C# (Windows Forms)",
            Description = "Простий калькулятор, 4 дії + корінь.",
            Price = 500,
            ExecutorPrice = 425,
            PlatformCommission = 75,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            Status = OrderStatus.Completed,
            ClientId = clientUser.Id,
            ExecutorId = executorUser.Id,
            DisciplineId = discCSharp.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = true
        };

        // --- Замовлення 9: НОВЕ ---
        var order9 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Парсер новин на C#",
            Description = "Потрібно зібрати заголовки з 3 сайтів і зберегти в CSV.",
            Price = 1800,
            ExecutorPrice = 1530,
            PlatformCommission = 270,
            IsNegotiable = true,
            Deadline = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discCSharp.Id,
            WorkTypeId = typeCourse.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 10: НОВЕ ---
        var order10 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Курсова робота з Web-технологій",
            Description = "Розробка блогу на Next.js + TailwindCSS. Звіт + код.",
            Price = 3500,
            ExecutorPrice = 2975,
            PlatformCommission = 525,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(20),
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discWeb.Id,
            WorkTypeId = typeCourse.Id,
            IsCommissionPaid = false
        };

        context.Orders.AddRange(orderNew, orderProgress, order3, order4, order5, order6, order7, order8, order9, order10);
        await context.SaveChangesAsync();

        // ==========================================
        // 5. ЧАТ ТА ПОВІДОМЛЕННЯ
        // ==========================================
        
        // Створюємо чат для замовлення "В роботі"
        var chat = new Chat { OrderId = orderProgress.Id };
        context.Chats.Add(chat);
        await context.SaveChangesAsync();

        var msg1 = new ChatMessage
        {
            ChatId = chat.Id,
            SenderId = clientUser.Id,
            Text = "Привіт! Коли зможеш почати?",
            SentAt = DateTime.UtcNow.AddHours(-5)
        };

        var msg2 = new ChatMessage
        {
            ChatId = chat.Id,
            SenderId = executorUser.Id,
            Text = "Вже почав, завтра скину перші напрацювання.",
            SentAt = DateTime.UtcNow.AddHours(-4)
        };

        context.ChatMessages.AddRange(msg1, msg2);

        // ==========================================
        // 6. СТАВКИ (Proposals)
        // ==========================================
        
        // Виконавець робить ставку на НОВЕ замовлення
        var proposal = new OrderProposal
        {
            OrderId = orderNew.Id,
            ExecutorId = executorUser.Id,
            Price = 2000,
            Comment = "Зроблю швидко і якісно. Є досвід з .NET.",
            Status = ProposalStatus.Pending
        };
        context.OrderProposals.Add(proposal);

        await context.SaveChangesAsync();
    }
}