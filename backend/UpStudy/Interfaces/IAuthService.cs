using UpStudy.Dtos;

namespace UpStudy.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto model);
    Task<AuthResponseDto> LoginAsync(LoginDto model);
    Task<AuthResponseDto> GoogleLoginAsync(string googleIdToken);
    Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
}