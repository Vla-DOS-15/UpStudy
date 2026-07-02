namespace UpStudy.Interfaces;

public interface IR2Service
{
    /// <summary>
    /// Завантажити файл в S3 (для будь-якого типу)
    /// </summary>
    Task<string> UploadFileAsync(IFormFile file, string folder, bool isPublicRead = false);
    
    /// <summary>
    /// Отримати presigned URL для завантаження файлу (дійсний 1 годину)
    /// </summary>
    Task<string> GetPresignedDownloadUrlAsync(string fileKey, int expirationMinutes = 60);
    
    /// <summary>
    /// Отримати presigned URL для перегляду (для картинок/PDF в браузері)
    /// </summary>
    Task<string> GetPresignedViewUrlAsync(string fileKey, int expirationMinutes = 60);
    
    /// <summary>
    /// Видалити файл з S3
    /// </summary>
    Task DeleteFileAsync(string fileKey);
    
    /// <summary>
    /// Перевірити чи існує файл
    /// </summary>
    Task<bool> FileExistsAsync(string fileKey);
}