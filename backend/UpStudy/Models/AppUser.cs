using Microsoft.AspNetCore.Identity;

namespace UpStudy.Models;

public class AppUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    // Профіль виконавця (необов'язкові поля, заповнюються якщо юзер хоче бути виконавцем)
    public string? AboutMe { get; set; }

    public Wallet? Wallet { get; set; }
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