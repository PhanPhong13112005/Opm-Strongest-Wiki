using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace OpmWiki.Infrastructure.Persistence;

public sealed class OpmWikiDbContextFactory : IDesignTimeDbContextFactory<OpmWikiDbContext>
{
    public OpmWikiDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__OpmWiki")
            ?? "Host=localhost;Port=5432;Database=opmwiki;Username=opmwiki;Password=opmwiki";
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new OpmWikiDbContext(options);
    }
}
