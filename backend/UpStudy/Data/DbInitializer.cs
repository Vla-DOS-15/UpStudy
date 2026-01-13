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

        context.Orders.AddRange(orderNew, orderProgress);
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