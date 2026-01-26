using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UpStudy.Data;
using UpStudy.Models; // Ваш namespace контексту

namespace UpStudy.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DictionaryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DictionaryController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("disciplines")]
    public async Task<IActionResult> GetDisciplines()
    {
        var result = await _context.Disciplines
            .AsNoTracking()
            .Select(d => new { d.Id, d.Name })
            .ToListAsync();
            
        return Ok(result);
    }

    [HttpGet("work-types")]
    public async Task<IActionResult> GetWorkTypes()
    {
        var result = await _context.WorkTypes
            .AsNoTracking()
            .Select(w => new { w.Id, w.Name })
            .ToListAsync();
            
        return Ok(result);
    }
}