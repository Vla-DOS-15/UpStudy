using Microsoft.AspNetCore.Mvc;
using UpStudy.Interfaces;

namespace UpStudy.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("authors")]
    public async Task<IActionResult> GetTopAuthors()
    {
        var authors = await _userService.GetTopAuthorsAsync();
        return Ok(authors);
    }
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        if (file == null || file.Length == 0)
            return BadRequest("File is empty");

        try
        {
            var avatarUrl = await _userService.UploadAvatarAsync(userId, file);
            return Ok(new { avatarUrl });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] Dtos.UpdateProfileDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        try
        {
             await _userService.UpdateProfileAsync(userId, dto);
             return Ok(new { message = "Profile updated successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
