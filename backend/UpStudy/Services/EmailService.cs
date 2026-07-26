using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using UpStudy.Interfaces;
using System;

namespace UpStudy.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var emailSettings = _config.GetSection("EmailSettings");
        var host = emailSettings["SmtpServer"];
        
        // If SMTP is not configured, just log to console
        if (string.IsNullOrEmpty(host))
        {
            Console.WriteLine("\n--- EMAIL MOCK ---");
            Console.WriteLine($"To: {to}\nSubject: {subject}\nBody: {body}");
            Console.WriteLine("------------------\n");
            return;
        }

        var port = int.Parse(emailSettings["SmtpPort"] ?? "587");
        var senderEmail = emailSettings["SenderEmail"];
        var senderPassword = emailSettings["SenderPassword"];
        var senderName = emailSettings["SenderName"] ?? "UpStudy";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        message.To.Add(new MailboxAddress("", to));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = body };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(senderEmail, senderPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] Failed to send email: {ex.Message}");
        }
    }
}
