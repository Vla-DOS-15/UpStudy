using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace UpStudy.Models;

public class ApplicationDbContext : IdentityDbContext<AppUser>
{
    public DbSet<RefreshTokenInfo> RefreshTokens { get; set; }
    
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderProposal> OrderProposals { get; set; }
    public DbSet<WorkType> WorkTypes { get; set; }
    public DbSet<Discipline> Disciplines { get; set; }
    public DbSet<Direction> Directions { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<ReadyWork> ReadyWorks { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<OrderAttachment> OrderAttachments { get; set; }
    public DbSet<ChatAttachment> ChatAttachments { get; set; }
    public DbSet<Wallet> Wallets { get; set; }
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // --- AppUser & Security ---
        builder.Entity<AppUser>()
            .HasMany(u => u.RefreshTokens)
            .WithOne(t => t.User)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // --- Order Configuration ---
        
        // Замовник -> Замовлення
        builder.Entity<Order>()
            .HasOne(o => o.Client)
            .WithMany(u => u.ClientOrders)
            .HasForeignKey(o => o.ClientId)
            .OnDelete(DeleteBehavior.Restrict); // Не можна видалити юзера, якщо у нього є активні замовлення

        // Виконавець -> Замовлення
        builder.Entity<Order>()
            .HasOne(o => o.Executor)
            .WithMany(u => u.ExecutorOrders)
            .HasForeignKey(o => o.ExecutorId)
            .OnDelete(DeleteBehavior.SetNull); // Якщо виконавця видалили, поле стає NULL

        // Замовлення -> Файли (Attachments)
        builder.Entity<Order>()
            .HasMany(o => o.Attachments)
            .WithOne(a => a.Order)
            .HasForeignKey(a => a.OrderId)
            .OnDelete(DeleteBehavior.Cascade); // Видаляємо замовлення -> видаляються записи про файли

        // Замовлення -> Чат
        builder.Entity<Order>()
            .HasOne(o => o.Chat)
            .WithOne(c => c.Order)
            .HasForeignKey<Chat>(c => c.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Замовлення -> Пропозиції
        builder.Entity<Order>()
            .HasMany(o => o.Proposals)
            .WithOne(p => p.Order)
            .HasForeignKey(p => p.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Замовлення -> Відгук (1 до 0..1)
        builder.Entity<Order>()
            .HasOne(o => o.Review)
            .WithOne(r => r.Order)
            .HasForeignKey<Review>(r => r.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // --- Chat Configuration ---

        builder.Entity<Chat>()
            .HasMany(c => c.Messages)
            .WithOne(m => m.Chat)
            .HasForeignKey(m => m.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        // Повідомлення -> Файли
        builder.Entity<ChatMessage>()
            .HasMany(m => m.Attachments)
            .WithOne(a => a.ChatMessage)
            .HasForeignKey(a => a.ChatMessageId)
            .OnDelete(DeleteBehavior.Cascade);

        // --- Reviews & Users ---
        
        // Відгуки, які "висять" на профілі юзера (TargetUser)
        builder.Entity<AppUser>()
            .HasMany(u => u.Reviews)
            .WithOne(r => r.TargetUser)
            .HasForeignKey(r => r.TargetUserId)
            .OnDelete(DeleteBehavior.Cascade); // Якщо видаляємо юзера, його рейтинг теж зникає

        // --- ReadyWorks (Готові роботи) ---
        
        builder.Entity<ReadyWork>()
            .HasOne(w => w.Author)
            .WithMany(u => u.ReadyWorks)
            .HasForeignKey(w => w.AuthorId)
            .OnDelete(DeleteBehavior.Cascade); // Або Restrict, якщо хочете зберегти роботи видаленого автора

        // --- Dictionaries (Довідники) ---
        // Забороняємо видаляти дисципліну, якщо до неї прив'язані замовлення
        builder.Entity<Order>()
            .HasOne(o => o.Discipline)
            .WithMany()
            .HasForeignKey(o => o.DisciplineId)
            .OnDelete(DeleteBehavior.Restrict); 
        
        builder.Entity<AppUser>()
            .HasOne(u => u.Wallet)
            .WithOne(w => w.User)
            .HasForeignKey<Wallet>(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // --- Money & Decimal Configuration ---
        builder.Entity<Order>().Property(o => o.Price).HasPrecision(18, 2);
        builder.Entity<OrderProposal>().Property(p => p.Price).HasPrecision(18, 2);
        builder.Entity<ReadyWork>().Property(w => w.Price).HasPrecision(18, 2);
        
        builder.Entity<Wallet>().Property(w => w.Balance).HasPrecision(18, 2);
        builder.Entity<Wallet>().Property(w => w.FrozenBalance).HasPrecision(18, 2);
        builder.Entity<WalletTransaction>().Property(t => t.Amount).HasPrecision(18, 2);
    }
}