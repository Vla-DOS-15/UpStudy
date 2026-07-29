using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace UpStudy.Models;

[PrimaryKey(nameof(OrderId), nameof(ExecutorId))]
public class OrderView
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    
    public string ExecutorId { get; set; } = string.Empty;
    public AppUser Executor { get; set; } = null!;
    
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
}
