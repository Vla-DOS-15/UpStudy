using Microsoft.AspNetCore.Http;
using UpStudy.Dtos;

namespace UpStudy.Interfaces;

public interface IUserService
{
    Task<List<AuthorDto>> GetTopAuthorsAsync(int limit = 20);
    Task<string> UploadAvatarAsync(string userId, IFormFile file);
    Task UpdateProfileAsync(string userId, UpdateProfileDto dto);
}
