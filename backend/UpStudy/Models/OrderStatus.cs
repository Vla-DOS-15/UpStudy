namespace UpStudy.Models;

public enum OrderStatus
{
    New = 1,            // Очікує виконавця
    InProgress = 2,     // Виконавець взяв в роботу
    Review = 3,         // На перевірці у замовника
    Completed = 4,      // Успішно завершено
    Cancelled = 5,      // Скасовано
    Dispute = 6         // Арбітраж (підключено менеджера)
}