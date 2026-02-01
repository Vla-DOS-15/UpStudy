using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace UpStudy.Models;

public class AppUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime LastActive { get; set; } = DateTime.UtcNow;
    
    // Профіль виконавця (необов'язкові поля, заповнюються якщо юзер хоче бути виконавцем)
    public string? AboutMe { get; set; }
    
    [StringLength(16)]
    public string? BankCardNumber { get; set; }
    
    [StringLength(100)]
    public string? BankCardOwnerName { get; set; } 
    
    public bool IsFop { get; set; } = false;
    
    public string? AvatarS3Key { get; set; }
    
    public bool IsVerified { get; set; } = false;
    public bool IsVerificationPending { get; set; } = false;    
    public string? VerificationRejectReason { get; set; }
    public string? PassportS3Key { get; set; }
    public string? DiplomaS3Key { get; set; }
    public double Rating { get; set; } = 0;
    public int CompletedOrdersCount { get; set; } = 0;

    public List<RefreshTokenInfo> RefreshTokens { get; set; } = new();

    // Замовлення, які створив цей юзер
    public List<Order> ClientOrders { get; set; } = new(); 
    
    // Замовлення, які цей юзер виконує
    public List<Order> ExecutorOrders { get; set; } = new();

    // Готові роботи на продаж
    public List<ReadyWork> ReadyWorks { get; set; } = new();
    
    // Відгуки, які отримав цей користувач
    public List<Review> Reviews { get; set; } = new();
}