using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using OpmWiki.Application.Abstractions;
using OpmWiki.Infrastructure;
using OpmWiki.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "OPM Strongest Wiki API",
        Version = "v1",
        Description = "API dữ liệu nhân vật và sự kiện cho OPM Strongest Wiki."
    });
});
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment.ContentRootPath);

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

var seedRequested = args.Any(x => string.Equals(x, "--seed-data", StringComparison.OrdinalIgnoreCase));
var migrateOnStartup = builder.Configuration.GetValue<bool>("Database:MigrateOnStartup");
if (seedRequested || migrateOnStartup)
{
    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<OpmWikiDbContext>();
    await dbContext.Database.MigrateAsync();

    if (seedRequested)
    {
        var result = await scope.ServiceProvider.GetRequiredService<IDataSeeder>().SeedAsync();
        app.Logger.LogInformation(
            "Seed completed: {Characters} characters, {Events} events.",
            result.Characters,
            result.Events);
        return;
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    service = "opmwiki-api",
    utc = DateTimeOffset.UtcNow
})).WithTags("Health");
app.MapGet("/api/health/database", async (
    IServiceScopeFactory scopeFactory,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    try
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<OpmWikiDbContext>();
        var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);
        return canConnect
            ? Results.Ok(new { status = "healthy", database = "connected" })
            : Results.Json(
                new { status = "unhealthy", database = "unavailable" },
                statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (Exception exception)
    {
        logger.LogWarning(exception, "Database health check failed.");
        return Results.Json(
            new { status = "unhealthy", database = "unavailable" },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
}).WithTags("Health");

app.Run();

public partial class Program;
