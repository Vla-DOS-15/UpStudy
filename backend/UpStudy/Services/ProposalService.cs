using Microsoft.EntityFrameworkCore;
using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Services;

public class ProposalService : IProposalService
{
    private readonly ApplicationDbContext _context;

    public ProposalService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OrderProposalDto> CreateProposalAsync(string executorId, CreateProposalDto dto)
    {
        // 1. Перевірка замовлення
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId);

        if (order == null)
            throw new KeyNotFoundException("Замовлення не знайдено");

        // 2. Валідація статусу (можна робити ставки тільки на нові замовлення)
        // Також перевіряємо, чи не обрано вже виконавця (ExecutorId == null)
        if (order.Status != OrderStatus.New || order.ExecutorId != null)
            throw new InvalidOperationException("Замовлення вже не приймає нових ставок.");

        // 3. Заборона ставити на свої ж замовлення
        if (order.ClientId == executorId)
            throw new InvalidOperationException("Ви не можете робити ставку на власне замовлення.");

        // 4. Перевірка на дублікат ставки (один виконавець — одна ставка на замовлення)
        var existingProposal = await _context.OrderProposals
            .AnyAsync(p => p.OrderId == dto.OrderId && p.ExecutorId == executorId);

        if (existingProposal)
            throw new InvalidOperationException("Ви вже зробили пропозицію до цього замовлення.");

        // 5. Створення пропозиції
        var proposal = new OrderProposal
        {
            Id = Guid.NewGuid(),
            OrderId = dto.OrderId,
            ExecutorId = executorId,
            Price = dto.Price,
            Comment = dto.Comment,
            Status = ProposalStatus.Pending
        };

        _context.OrderProposals.Add(proposal);
        await _context.SaveChangesAsync();

        // Повертаємо DTO (щоб не повертати циклічні посилання сутності)
        return new OrderProposalDto
        {
            Id = proposal.Id,
            Price = proposal.Price,
            Comment = proposal.Comment,
            Status = proposal.Status.ToString(),
            ExecutorId = proposal.ExecutorId,
            // Ім'я виконавця можна підтягнути окремо або через Include, 
            // тут для швидкості повертаємо поки так, або завантажимо AppUser
            ExecutorName = "Me" // На фронті це буде "Я"
        };
    }

    public async Task DeleteProposalAsync(Guid proposalId, string executorId)
    {
        var proposal = await _context.OrderProposals
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == proposalId);

        if (proposal == null)
            throw new KeyNotFoundException("Пропозицію не знайдено");

        // Тільки власник може видалити
        if (proposal.ExecutorId != executorId)
            throw new UnauthorizedAccessException("Ви не можете видалити чужу ставку.");

        // Не можна видалити ставку, якщо її вже прийняли
        if (proposal.Status == ProposalStatus.Accepted || proposal.Order.Status != OrderStatus.New)
            throw new InvalidOperationException(
                "Неможливо видалити ставку, оскільки її вже прийнято або замовлення в роботі.");

        _context.OrderProposals.Remove(proposal);
        await _context.SaveChangesAsync();
    }
}