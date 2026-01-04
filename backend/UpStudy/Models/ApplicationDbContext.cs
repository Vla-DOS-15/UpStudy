using Microsoft.EntityFrameworkCore;

namespace UpStudy.Models;

public class ApplicationDbContext : DbContext
{
    public DbSet<AppUser> AppUsers { get; set; }
    
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
    }
}