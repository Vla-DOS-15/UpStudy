using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using UpStudy.Dtos;
using UpStudy.Interfaces;
using UpStudy.Models;

namespace UpStudy.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IEmailService _emailService;
    
    public AuthService(
        UserManager<AppUser> userManager, 
        IConfiguration configuration,
        ApplicationDbContext context,
        RoleManager<IdentityRole> roleManager,
        IEmailService emailService)
    {
        _userManager = userManager;
        _configuration = configuration;
        _context = context;
        _roleManager = roleManager;
        _emailService = emailService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto model)
    {
        // --- 0. ВАЛІДАЦІЯ РОЛІ (БЕЗПЕКА) ---
        // Дозволяємо реєструватись тільки як Client або Executor.
        // Це захищає від спроб зареєструватись як "Admin"
        if (model.Role != "Client" && model.Role != "Executor")
        {
            return new AuthResponseDto { IsSuccess = false, Message = "Недопустима роль користувача" };
        }

        // 1. Перевірка Email (ваш код)
        var emailExists = await _userManager.FindByEmailAsync(model.Email);
        if (emailExists != null)
            return new AuthResponseDto { IsSuccess = false, Message = "Користувач з таким email вже існує" };

        // 2. Перевірка UserName (ваш код)
        var userNameExists = await _userManager.FindByNameAsync(model.UserName);
        if (userNameExists != null)
            return new AuthResponseDto { IsSuccess = false, Message = "Цей юзернейм вже зайнятий" };

        // 3. Валідація для виконавця (ваш код)
        if (model.Role == "Executor")
        {
            if (string.IsNullOrWhiteSpace(model.FirstName) || string.IsNullOrWhiteSpace(model.LastName))
                return new AuthResponseDto { IsSuccess = false, Message = "Ім'я та прізвище обов'язкові для виконавця" };
            if (string.IsNullOrWhiteSpace(model.PhoneNumber))
                return new AuthResponseDto { IsSuccess = false, Message = "Номер телефону обов'язковий для виконавця" };
        }

        string? formattedTelegram = model.Telegram;
        if (!string.IsNullOrWhiteSpace(formattedTelegram) && !formattedTelegram.StartsWith("@"))
        {
            formattedTelegram = "@" + formattedTelegram;
        }

        var user = new AppUser
        {
            Email = model.Email,
            UserName = model.UserName,
            FirstName = model.Role == "Client" ? (model.FirstName ?? "Client") : model.FirstName!,
            LastName = model.Role == "Client" ? (model.LastName ?? "") : model.LastName!,
            PhoneNumber = model.PhoneNumber,
            Telegram = formattedTelegram,
            SecurityStamp = Guid.NewGuid().ToString(),
            EmailConfirmed = false,
            EmailVerificationCode = new Random().Next(1000, 10000).ToString(),
            EmailVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(5)
            // IsVerified = false за замовчуванням
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return new AuthResponseDto { IsSuccess = false, Message = errors };
        }

        // --- 4. ПРИСВОЄННЯ РОЛІ (ВИПРАВЛЕНО) ---
        
        // Перевіряємо, чи існує роль у БД. Якщо ні - створюємо її.
        if (!await _roleManager.RoleExistsAsync(model.Role))
        {
            await _roleManager.CreateAsync(new IdentityRole(model.Role));
        }

        // Тепер безпечно додаємо користувача до ролі
        await _userManager.AddToRoleAsync(user, model.Role);

        // Відправляємо код підтвердження
        string emailBody = $@"
            <h2>Ласкаво просимо до UpStudy!</h2>
            <p>Ваш код для підтвердження пошти: <b>{user.EmailVerificationCode}</b></p>
            <p>Код дійсний 5 хвилин.</p>";
        await _emailService.SendEmailAsync(user.Email, "Підтвердження реєстрації", emailBody);

        var authResponse = await GenerateTokensAndSaveAsync(user);
        authResponse.Message = "Реєстрація успішна! Будь ласка, підтвердіть вашу пошту.";

        return authResponse;
    }

    // --- ЛОГІН ---
    public async Task<AuthResponseDto> LoginAsync(LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        
        if (user == null)
            return new AuthResponseDto { IsSuccess = false, Message = "Невірний логін або пароль" };
        
        if (await _userManager.IsLockedOutAsync(user))
        {
            return new AuthResponseDto { 
                IsSuccess = false, 
                Message = "Ваш акаунт заблоковано адміністрацією. Зверніться до підтримки." 
            };
        }
        
        if (!await _userManager.CheckPasswordAsync(user, model.Password))
        {
            return new AuthResponseDto { IsSuccess = false, Message = "Невірний логін або пароль" };
        }

        return await GenerateTokensAndSaveAsync(user);
    }

    // --- GOOGLE LOGIN ---
    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto model)
    {
        try
        {
            var clientId = _configuration["Google:ClientId"];
            var clientSecret = _configuration["Google:ClientSecret"];
            
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                return new AuthResponseDto { IsSuccess = false, Message = "Google ClientId або ClientSecret не налаштовано на сервері" };
            }

            using var httpClient = new HttpClient();
            var tokenResponse = await httpClient.PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = model.Code,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret,
                ["redirect_uri"] = "postmessage",
                ["grant_type"] = "authorization_code"
            }));

            if (!tokenResponse.IsSuccessStatusCode)
            {
                var error = await tokenResponse.Content.ReadAsStringAsync();
                return new AuthResponseDto { IsSuccess = false, Message = "Помилка обміну коду Google: " + error };
            }

            using var jsonDoc = await JsonDocument.ParseAsync(await tokenResponse.Content.ReadAsStreamAsync());
            if (!jsonDoc.RootElement.TryGetProperty("id_token", out var idTokenElement))
            {
                return new AuthResponseDto { IsSuccess = false, Message = "Відсутній id_token у відповіді Google" };
            }

            var idToken = idTokenElement.GetString();
            if (string.IsNullOrEmpty(idToken))
            {
                return new AuthResponseDto { IsSuccess = false, Message = "Порожній id_token" };
            }

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken);
            var user = await _userManager.FindByEmailAsync(payload.Email);

            if (user != null)
            {
                if (user.PasswordHash != null)
                {
                    return new AuthResponseDto { IsSuccess = false, Message = "Дані не сходяться (Ви реєструвались через email та пароль)" };
                }
            }
            else
            {
                string emailPrefix = payload.Email.Split('@')[0];
                string randomChars = GenerateRandomAlphanumeric(6);
                string username = $"{emailPrefix}{randomChars}";

                string roleToAssign = (model.Role == "Client" || model.Role == "Executor") ? model.Role : "Client";

                user = new AppUser
                {
                    Email = payload.Email,
                    UserName = username,
                    FirstName = payload.GivenName ?? "User",
                    LastName = payload.FamilyName ?? "",
                    EmailConfirmed = true,
                    SecurityStamp = Guid.NewGuid().ToString()
                };
                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    return new AuthResponseDto { IsSuccess = false, Message = "Не вдалося створити користувача через Google" };
                
                if (!await _roleManager.RoleExistsAsync(roleToAssign))
                {
                    await _roleManager.CreateAsync(new IdentityRole(roleToAssign));
                }
                await _userManager.AddToRoleAsync(user, roleToAssign);
            }

            return await GenerateTokensAndSaveAsync(user);
        }
        catch
        {
            return new AuthResponseDto { IsSuccess = false, Message = "Google Token Invalid" };
        }
    }

    private string GenerateRandomAlphanumeric(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
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
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.GivenName, user.FirstName ?? ""),
            new Claim(ClaimTypes.Surname, user.LastName ?? ""),
            new Claim("IsVerified", user.IsVerified.ToString()),
            new Claim("IsVerificationPending", user.IsVerificationPending.ToString()),
            new Claim("EmailConfirmed", user.EmailConfirmed.ToString())
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
    
    
    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto model)
    {
        // 1. Отримуємо ClaimsPrincipal зі старого Access токена (ігноруючи час життя)
        var principal = GetPrincipalFromExpiredToken(model.AccessToken);
        if (principal == null)
            return new AuthResponseDto { IsSuccess = false, Message = "Invalid access token" };

        // 2. Дістаємо ID користувача
        var userId = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return new AuthResponseDto { IsSuccess = false, Message = "Invalid token claims" };

        // 3. Шукаємо Refresh токен в БД, який відповідає цьому токену і юзеру
        var storedRefreshToken = _context.RefreshTokens
            .FirstOrDefault(x => x.Token == model.RefreshToken && x.UserId == userId);

        // 4. Перевірки самого токена
        if (storedRefreshToken == null)
            return new AuthResponseDto { IsSuccess = false, Message = "Invalid refresh token" };

        if (storedRefreshToken.Expiry < DateTime.UtcNow)
        {
            // Токен протух - видаляємо його, змушуємо юзера логінитись заново
            _context.RefreshTokens.Remove(storedRefreshToken);
            await _context.SaveChangesAsync();
            return new AuthResponseDto { IsSuccess = false, Message = "Refresh token expired. Please login again." };
        }

        // 5. Отримуємо юзера
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return new AuthResponseDto { IsSuccess = false, Message = "User not found" };

        // 🔥 5.1. ПЕРЕВІРКА НА БЛОКУВАННЯ (LOCKOUT)
        // Це ключовий момент: якщо юзер заблокований, ми не даємо йому нову пару токенів
        if (await _userManager.IsLockedOutAsync(user))
        {
            // Видаляємо поточний рефреш токен, щоб запобігти повторним спробам
            _context.RefreshTokens.Remove(storedRefreshToken);
            await _context.SaveChangesAsync();

            return new AuthResponseDto 
            { 
                IsSuccess = false, 
                Message = "Ваш акаунт заблоковано адміністрацією. Зверніться до підтримки." 
            };
        }

        // 6. Refresh Token Rotation (Безпека):
        // Видаляємо використаний Refresh токен, щоб його не можна було юзати двічі
        _context.RefreshTokens.Remove(storedRefreshToken);
        await _context.SaveChangesAsync();

        // 7. Генеруємо нову пару і зберігаємо новий Refresh токен
        return await GenerateTokensAndSaveAsync(user);
    }

    // === Допоміжний метод: Розшифровка Expired Token ===
    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string? token)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            
            // ВАЖЛИВО: Ми не перевіряємо час життя тут, бо токен вже Expired
            ValidateLifetime = false 
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            
            // Додаткова перевірка, що це саме HMACSHA256 токен
            if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }

    public async Task<AuthResponseDto> VerifyEmailAsync(VerifyEmailDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return new AuthResponseDto { IsSuccess = false, Message = "Користувача не знайдено." };

        if (user.EmailConfirmed)
            return new AuthResponseDto { IsSuccess = false, Message = "Пошта вже підтверджена." };

        if (user.EmailVerificationCode != model.Code)
            return new AuthResponseDto { IsSuccess = false, Message = "Неправильний код підтвердження." };

        if (user.EmailVerificationCodeExpiry == null || user.EmailVerificationCodeExpiry < DateTime.UtcNow)
            return new AuthResponseDto { IsSuccess = false, Message = "Код підтвердження недійсний або його термін дії минув." };

        user.EmailConfirmed = true;
        user.EmailVerificationCode = null;
        user.EmailVerificationCodeExpiry = null;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return new AuthResponseDto { IsSuccess = false, Message = "Помилка при підтвердженні пошти." };

        return await GenerateTokensAndSaveAsync(user);
    }

    public async Task<AuthResponseDto> ResendVerificationAsync(ResendVerificationDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return new AuthResponseDto { IsSuccess = false, Message = "Користувача не знайдено." };

        if (user.EmailConfirmed)
            return new AuthResponseDto { IsSuccess = false, Message = "Пошта вже підтверджена." };

        user.EmailVerificationCode = new Random().Next(1000, 10000).ToString();
        user.EmailVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(5);

        await _userManager.UpdateAsync(user);

        string emailBody = $@"
            <h2>Ласкаво просимо до UpStudy!</h2>
            <p>Ваш новий код для підтвердження пошти: <b>{user.EmailVerificationCode}</b></p>
            <p>Код дійсний 5 хвилин.</p>";
        await _emailService.SendEmailAsync(user.Email, "Новий код підтвердження реєстрації", emailBody);

        return new AuthResponseDto { IsSuccess = true, Message = "Новий код відправлено на пошту." };
    }
}