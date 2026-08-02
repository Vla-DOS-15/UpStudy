using UpStudy.Dtos;

namespace UpStudy.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto model);
    Task<AuthResponseDto> LoginAsync(LoginDto model);
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto model);
    Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto model);
    Task<AuthResponseDto> VerifyEmailAsync(VerifyEmailDto model);
    Task<AuthResponseDto> ResendVerificationAsync(ResendVerificationDto model);
}