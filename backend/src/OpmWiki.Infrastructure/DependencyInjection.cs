using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpmWiki.Application.Abstractions;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;
using OpmWiki.Infrastructure.Seeding;

namespace OpmWiki.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        string contentRootPath)
    {
        var connectionString = configuration.GetConnectionString("OpmWiki")
            ?? throw new InvalidOperationException("Connection string 'OpmWiki' is not configured.");

        services.AddDbContext<OpmWikiDbContext>(options => options.UseNpgsql(
            connectionString,
            npgsql => npgsql.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null)));
        services.AddScoped<ICharacterRepository, CharacterRepository>();
        services.AddScoped<IAdminCharacterRepository, AdminCharacterRepository>();
        services.AddScoped<IKeepsakeRepository, KeepsakeRepository>();
        services.AddScoped<IEventRepository, EventRepository>();
        services.AddScoped<IMasteryRepository, MasteryRepository>();
        services.AddScoped<IInsigniaRepository, InsigniaRepository>();
        services.AddScoped<IBackgearRepository, BackgearRepository>();
        services.AddScoped<ITacticRepository, TacticRepository>();
        services.AddScoped<ICommunityRepository, CommunityRepository>();
        services.AddScoped<IDataSeeder, JsonDataSeeder>();

        var configuredDataPath = configuration["SeedData:FrontendDataPath"] ?? "../../../src/data";
        var absoluteDataPath = Path.IsPathRooted(configuredDataPath)
            ? configuredDataPath
            : Path.GetFullPath(configuredDataPath, contentRootPath);
        services.Configure<SeedDataOptions>(options => options.FrontendDataPath = absoluteDataPath);

        return services;
    }
}
