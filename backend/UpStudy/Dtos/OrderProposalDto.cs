namespace UpStudy.Dtos;

public class OrderProposalDto
{
    public Guid Id { get; set; }
    public decimal Price { get; set; }
    public string Comment { get; set; }
    public string Status { get; set; }
    public string ExecutorId { get; set; }
    public string ExecutorName { get; set; }
    
    public string? ExecutorAvatar { get; set; }       // URL аватара
    public double ExecutorRating { get; set; }        // Середній рейтинг (наприклад, 4.9)
    public int ExecutorCompletedProjects { get; set; } // Кількість виконаних замовлень
    public List<string> ExecutorSpecializations { get; set; } = new(); // Наприклад ["C#", "React"]
    public bool ExecutorIsVerified { get; set; }      // Чи верифікований юзер
}