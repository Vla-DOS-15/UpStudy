using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using UpStudy.Dtos;
using UpStudy.Models;

namespace UpStudy.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto model);
    Task<AuthResponseDto> LoginAsync(LoginDto model);
    Task<AuthResponseDto> GoogleLoginAsync(string googleIdToken);
    Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
}

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthService(UserManager<AppUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    // --- РЕЄСТРАЦІЯ ---
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto model)
    {
        var userExists = await _userManager.FindByEmailAsync(model.Email);
        if (userExists != null)
        {
            return new AuthResponseDto { IsSuccess = false, Message = "Користувач з таким email вже існує" };
        }

        var user = new AppUser
        {
            Email = model.Email,
            UserName = model.Email, // Часто username = email
            FirstName = model.FirstName,
            LastName = model.LastName,
            SecurityStamp = Guid.NewGuid().ToString()
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return new AuthResponseDto { IsSuccess = false, Message = errors };
        }

        var accessToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return new AuthResponseDto 
        { 
            IsSuccess = true, 
            Message = "Користувача створено і здійснено вхід!",
            AccessToken = accessToken,
            RefreshToken = refreshToken 
        };
    }

    // --- ЛОГІН ---
    public async Task<AuthResponseDto> LoginAsync(LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        
        // Перевірка: чи існує юзер і чи правильний пароль
        if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
        {
            return new AuthResponseDto { IsSuccess = false, Message = "Невірний логін або пароль" };
        }

        // Генеруємо токени
        var accessToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        // Зберігаємо Refresh Token у базу
        user.RefreshToken = refreshToken;
        // Час життя Refresh Token (наприклад, 7 днів)
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        
        await _userManager.UpdateAsync(user);

        return new AuthResponseDto
        {
            IsSuccess = true,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            Message = "Успішний вхід"
        };
    }

    // --- GOOGLE LOGIN (Скорочено для прикладу) ---
    public async Task<AuthResponseDto> GoogleLoginAsync(string googleIdToken)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(googleIdToken);
            var user = await _userManager.FindByEmailAsync(payload.Email);

            if (user == null)
            {
                user = new AppUser
                {
                    Email = payload.Email,
                    UserName = payload.Email,
                    FirstName = payload.GivenName,
                    LastName = payload.FamilyName,
                    EmailConfirmed = true
                };
                await _userManager.CreateAsync(user);
            }

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            return new AuthResponseDto 
            { 
                IsSuccess = true, 
                AccessToken = accessToken, 
                RefreshToken = refreshToken 
            };
        }
        catch
        {
            return new AuthResponseDto { IsSuccess = false, Message = "Google Token Invalid" };
        }
    }

    // === ПРИВАТНІ ДОПОМІЖНІ МЕТОДИ ===

    private string GenerateJwtToken(AppUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // Унікальний ID токена
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            // Access token живе мало (наприклад 15-60 хвилин)
            Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["DurationInMinutes"]!)),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
    
    public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        
        if (result.Succeeded)
        {
            // КРИТИЧНО ВАЖЛИВО: Анулюємо Refresh Token при зміні пароля
            // Це змусить користувача перелогінитись на всіх пристроях, коли стече час життя короткого Access Token
            user.RefreshToken = null;
            await _userManager.UpdateAsync(user);
            return true;
        }

        return false;
    }
}