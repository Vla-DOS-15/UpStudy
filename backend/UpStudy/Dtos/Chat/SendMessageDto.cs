namespace UpStudy.Dtos.Chat;

public class SendMessageDto
{
    public string Text { get; set; } = string.Empty;
    public string? CandidateId { get; set; }
}