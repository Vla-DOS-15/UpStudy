using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public AuthService(
        UserManager<AppUser> userManager, 
        IConfiguration configuration,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _configuration = configuration;
        _context = context;
    }

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
            UserName = model.Email,
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
        
        // Опціонально: Додаємо дефолтну роль
        // await _userManager.AddToRoleAsync(user, "User");

        var authResponse = await GenerateTokensAndSaveAsync(user);
        authResponse.Message = "Користувача створено успішно!";
        
        return authResponse;
    }

    // --- ЛОГІН ---
    public async Task<AuthResponseDto> LoginAsync(LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        
        if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
        {
            return new AuthResponseDto { IsSuccess = false, Message = "Невірний логін або пароль" };
        }

        return await GenerateTokensAndSaveAsync(user);
    }

    // --- GOOGLE LOGIN ---
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
                    EmailConfirmed = true,
                    SecurityStamp = Guid.NewGuid().ToString()
                };
                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    return new AuthResponseDto { IsSuccess = false, Message = "Не вдалося створити користувача через Google" };
                
                // await _userManager.AddToRoleAsync(user, "User");
            }

            return await GenerateTokensAndSaveAsync(user);
        }
        catch
        {
            return new AuthResponseDto { IsSuccess = false, Message = "Google Token Invalid" };
        }
    }

    // --- ЗМІНА ПАРОЛЯ ---
    public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        
        if (result.Succeeded)
        {
            // Анулюємо ВСІ Refresh токени користувача, щоб викинути його з усіх пристроїв
            var userTokens = _context.RefreshTokens.Where(t => t.UserId == userId);
            _context.RefreshTokens.RemoveRange(userTokens);
            await _context.SaveChangesAsync();
            
            return true;
        }

        return false;
    }

    // === ПРИВАТНІ ДОПОМІЖНІ МЕТОДИ ===

    // Метод, який генерує обидва токени і зберігає Refresh в БД
    private async Task<AuthResponseDto> GenerateTokensAndSaveAsync(AppUser user)
    {
        // 1. JWT Access Token
        var accessToken = await GenerateJwtToken(user);
        
        // 2. Refresh Token
        var refreshToken = GenerateRefreshTokenString();

        // 3. Зберігаємо Refresh Token в окрему таблицю
        var refreshTokenEntity = new RefreshTokenInfo
        {
            Token = refreshToken,
            UserId = user.Id,
            Expiry = DateTime.UtcNow.AddDays(7), // Живе 7 днів
            Created = DateTime.UtcNow
            // CreatedByIp можна додати, якщо прокинути сюди HttpContext
        };

        await _context.RefreshTokens.AddAsync(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            IsSuccess = true,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            Message = "Успішний вхід"
        };
    }

    private async Task<string> GenerateJwtToken(AppUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

        // Отримуємо ролі користувача з БД
        var userRoles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Додаємо ролі в Claims
        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["DurationInMinutes"]!)),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private string GenerateRefreshTokenString()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}