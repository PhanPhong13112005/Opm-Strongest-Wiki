using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace OpmWiki.Infrastructure.Persistence;

public sealed class OpmWikiDbContextFactory : IDesignTimeDbContextFactory<OpmWikiDbContext>
{
    public OpmWikiDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__OpmWiki");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings__OpmWiki is required for design-time database operations.");
        }

        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new OpmWikiDbContext(options);
    }
}
