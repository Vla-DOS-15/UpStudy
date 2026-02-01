namespace UpStudy.Dtos.Chat;

public class ChatDetailsDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string? CandidateId { get; set; }
    // Can add order title, price etc here later
}
