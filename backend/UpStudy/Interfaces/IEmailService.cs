using System.Threading.Tasks;

namespace UpStudy.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
}
