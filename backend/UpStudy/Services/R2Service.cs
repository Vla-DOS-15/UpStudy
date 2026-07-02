using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using UpStudy.Interfaces;

namespace UpStudy.Services;

public class R2Service : IR2Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly ILogger<R2Service> _logger;

    public R2Service(IAmazonS3 s3Client, IConfiguration configuration, ILogger<R2Service> logger)
    {
        _s3Client = s3Client;
        _bucketName = configuration["AWS:BucketName"] 
            ?? throw new ArgumentNullException("AWS:BucketName не налаштовано");
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folder, bool isPublicRead = false)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Файл порожній");

        // Генеруємо унікальне ім'я: folder/guid_originalname.ext
        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var fileKey = $"{folder}/{uniqueFileName}";

        try
        {
            using var stream = file.OpenReadStream();
            
            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = stream,
                Key = fileKey,
                BucketName = _bucketName,
                ContentType = file.ContentType,
                Metadata = 
                {
                    ["original-filename"] = System.Net.WebUtility.UrlEncode(file.FileName)
                },
                DisablePayloadSigning = true // FIX for Cloudflare R2 (STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER)
            };

            // Публічний доступ НЕ потрібен - використовуємо presigned URLs
            var transferUtility = new TransferUtility(_s3Client);
            await transferUtility.UploadAsync(uploadRequest);

            _logger.LogInformation("Файл завантажено: {FileKey}", fileKey);
            
            return fileKey;
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "Помилка завантаження в S3: {FileKey}", fileKey);
            throw new InvalidOperationException($"Помилка завантаження файлу: {ex.Message}");
        }
    }

    public async Task<string> GetPresignedDownloadUrlAsync(string fileKey, int expirationMinutes = 60)
    {
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = fileKey,
                Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
                // Змусити браузер завантажити файл (а не відкрити)
                ResponseHeaderOverrides = new ResponseHeaderOverrides
                {
                    ContentDisposition = "attachment"
                }
            };

            return await Task.FromResult(_s3Client.GetPreSignedURL(request));
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "Помилка генерації presigned URL: {FileKey}", fileKey);
            throw new InvalidOperationException("Не вдалося згенерувати посилання для завантаження");
        }
    }

    public async Task<string> GetPresignedViewUrlAsync(string fileKey, int expirationMinutes = 60)
    {
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = fileKey,
                Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
                // Дозволити браузеру відкрити файл (для перегляду картинок/PDF)
                ResponseHeaderOverrides = new ResponseHeaderOverrides
                {
                    ContentDisposition = "inline"
                }
            };

            return await Task.FromResult(_s3Client.GetPreSignedURL(request));
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "Помилка генерації presigned URL: {FileKey}", fileKey);
            throw new InvalidOperationException("Не вдалося згенерувати посилання для перегляду");
        }
    }

    public async Task DeleteFileAsync(string fileKey)
    {
        try
        {
            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = fileKey
            };

            await _s3Client.DeleteObjectAsync(deleteRequest);
            _logger.LogInformation("Файл видалено: {FileKey}", fileKey);
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "Помилка видалення з S3: {FileKey}", fileKey);
            throw new InvalidOperationException($"Помилка видалення файлу: {ex.Message}");
        }
    }

    public async Task<bool> FileExistsAsync(string fileKey)
    {
        try
        {
            var request = new GetObjectMetadataRequest
            {
                BucketName = _bucketName,
                Key = fileKey
            };

            await _s3Client.GetObjectMetadataAsync(request);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }
}