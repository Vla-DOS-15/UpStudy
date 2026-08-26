using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UpStudy.Data;
using UpStudy.Models;
using UpStudy.Services;

namespace UpStudy.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DictionaryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IDictionaryService _dictionaryService;

    public DictionaryController(ApplicationDbContext context, IDictionaryService dictionaryService)
    {
        _context = context;
        _dictionaryService = dictionaryService;
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

    [HttpGet("directions")]
    public async Task<IActionResult> GetDirections()
    {
        var result = await _context.Directions
            .AsNoTracking()
            .Select(d => new
            {
                d.Id,
                d.Name,
                Disciplines = d.Disciplines.Select(disc => new { disc.Id, disc.Name }).ToList()
            })
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

    [HttpGet("universities")]
    public async Task<IActionResult> GetUniversities([FromQuery] string query = "")
    {
        var universities = await _dictionaryService.SearchUniversitiesAsync(query);
        return Ok(universities);
    }
}