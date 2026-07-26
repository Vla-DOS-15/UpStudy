using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpStudy.Interfaces;

namespace UpStudy.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ConsultantsController : ControllerBase
{
    private readonly IConsultantService _consultantService;

    public ConsultantsController(IConsultantService consultantService)
    {
        _consultantService = consultantService;
    }

    [HttpGet]
    [AllowAnonymous] // Maybe clients are not authorized? Let's allow everyone to see the rating
    public async Task<IActionResult> GetConsultants()
    {
        var result = await _consultantService.GetTopConsultantsAsync();
        return Ok(result);
    }
}
