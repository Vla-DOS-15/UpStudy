using UpStudy.Dtos.Admin;

namespace UpStudy.Interfaces;

public interface IAdminService
{
    /// <summary>
    /// Отримати список користувачів, які очікують верифікації (IsVerificationPending = true)
    /// </summary>
    Task<List<UserPreviewDto>> GetPendingVerificationsAsync();

    /// <summary>
    /// Отримати деталі конкретного користувача для верифікації (з посиланнями на документи)
    /// </summary>
    Task<VerificationDetailsDto> GetVerificationDetailsAsync(string userId);

    /// <summary>
    /// Підтвердити верифікацію користувача
    /// </summary>
    Task ApproveUserAsync(string userId);

    /// <summary>
    /// Відхилити верифікацію із зазначенням причини
    /// </summary>
    Task RejectUserAsync(string userId, string reason);

    /// <summary>
    /// Отримати список усіх користувачів системи (для загального адміністрування)
    /// </summary>
    Task<List<UserPreviewDto>> GetAllUsersAsync();
    
    Task ToggleBlockUserAsync(string userId, bool isBlocked);
}