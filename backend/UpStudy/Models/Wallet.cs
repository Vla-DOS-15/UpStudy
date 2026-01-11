using System.ComponentModel.DataAnnotations;

namespace UpStudy.Models;

public class Wallet
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    // Зв'язок з юзером
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    // Гроші, доступні для операцій
    public decimal Balance { get; set; } = 0;

    // Гроші, заморожені в активних угодах
    public decimal FrozenBalance { get; set; } = 0;

    // Для захисту від паралельних змін (Optimistic Concurrency)
    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public List<WalletTransaction> Transactions { get; set; } = new();
}