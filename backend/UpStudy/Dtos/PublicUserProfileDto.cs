using System;
using System.Collections.Generic;

namespace UpStudy.Dtos;

public class PublicUserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? AboutMe { get; set; }
    public DateTime RegisteredAt { get; set; }
    public List<string> Roles { get; set; } = new();
    
    // Специфічно для Виконавців
    public bool IsVerified { get; set; }
    public double Rating { get; set; }
    public List<string> PreferredDisciplines { get; set; } = new();
    
    // Загальна статистика
    public int CompletedOrdersCount { get; set; }

    // Відгуки
    public List<ReviewDto> Reviews { get; set; } = new();
}
