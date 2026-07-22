using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using OpmWiki.Api.Security;
using OpmWiki.Api.Services;
using OpmWiki.Application.Abstractions;
using OpmWiki.Infrastructure;
using OpmWiki.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Railway and similar platforms provide the listening port via PORT.
// Prefer it when present while keeping ASPNETCORE_URLS for local/Docker usage.
var platformPort = builder.Configuration["PORT"];
if (int.TryParse(platformPort, out var parsedPort) && parsedPort is > 0 and <= 65535)
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{parsedPort}");
}

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
        Description = "API dữ liệu nhân vật, sự kiện và hệ thống tra cứu cho OPM Strongest Wiki."
    });
});
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment.ContentRootPath);

var adminAuthOptions = builder.Configuration
    .GetSection(AdminAuthOptions.SectionName)
    .Get<AdminAuthOptions>() ?? new AdminAuthOptions();
if (builder.Environment.IsDevelopment())
{
    if (string.IsNullOrWhiteSpace(adminAuthOptions.Username)) adminAuthOptions.Username = "admin";
    if (string.IsNullOrWhiteSpace(adminAuthOptions.Password)) adminAuthOptions.Password = "dev-only-change-me";
    if (string.IsNullOrWhiteSpace(adminAuthOptions.JwtSigningKey))
        adminAuthOptions.JwtSigningKey = "development-only-opmwiki-admin-signing-key-change-me";
}
else if (string.IsNullOrWhiteSpace(adminAuthOptions.Username) ||
         string.IsNullOrWhiteSpace(adminAuthOptions.Password) ||
         adminAuthOptions.JwtSigningKey.Length < 32)
{
    throw new InvalidOperationException(
        "AdminAuth username, password and a JWT signing key of at least 32 characters must be configured.");
}

builder.Services.AddSingleton(adminAuthOptions);
builder.Services.AddSingleton<AdminTokenService>();
builder.Services.AddSingleton<PasswordHasher>();
var aiAdvisorOptions = builder.Configuration.GetSection(AiAdvisorOptions.SectionName).Get<AiAdvisorOptions>() ?? new();
builder.Services.AddSingleton(aiAdvisorOptions);
builder.Services.AddHttpClient<AiAdvisorClient>(client => client.Timeout = TimeSpan.FromSeconds(20));
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "OpmWiki.Api",
            ValidateAudience = true,
            ValidAudience = "OpmWiki.Web",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = AdminTokenService.CreateSigningKey(adminAuthOptions.JwtSigningKey),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("admin-login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

var seedRequested = args.Any(x => string.Equals(x, "--seed-data", StringComparison.OrdinalIgnoreCase));
var migrateOnStartup = builder.Configuration.GetValue<bool>("Database:MigrateOnStartup");
var seedWhenEmpty = builder.Configuration.GetValue<bool>("Database:SeedWhenEmpty");
if (seedRequested || migrateOnStartup || seedWhenEmpty)
{
    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<OpmWikiDbContext>();
    await dbContext.Database.MigrateAsync();

    var databaseIsEmpty = seedWhenEmpty && !await dbContext.Characters.AsNoTracking().AnyAsync();
    if (seedRequested || databaseIsEmpty)
    {
        var result = await scope.ServiceProvider.GetRequiredService<IDataSeeder>().SeedAsync();
        app.Logger.LogInformation(
            "Seed completed: {Characters} characters, {Events} events, {MasteryTiers} mastery tiers, {Insignias} insignias, {Backgears} backgears, {BackgearSets} backgear sets, {TacticCards} tactic cards and {TacticFrames} tactic frames.",
            result.Characters,
            result.Events,
            result.MasteryTiers,
            result.Insignias,
            result.Backgears,
            result.BackgearSets,
            result.TacticCards,
            result.TacticFrames);
        if (seedRequested) return;
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

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
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
