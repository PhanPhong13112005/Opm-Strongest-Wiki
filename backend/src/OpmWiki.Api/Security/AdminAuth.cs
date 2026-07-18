using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace OpmWiki.Api.Security;

public sealed class AdminAuthOptions
{
    public const string SectionName = "AdminAuth";
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string JwtSigningKey { get; set; } = string.Empty;
    public int TokenLifetimeMinutes { get; set; } = 60;
}

public sealed record AdminLoginRequest(string Username, string Password);
public sealed record AdminLoginResponse(string AccessToken, DateTimeOffset ExpiresAt, string Username);

public sealed class AdminTokenService(AdminAuthOptions options)
{
    public bool ValidateCredentials(string username, string password) =>
        FixedTimeEquals(username, options.Username) &&
        FixedTimeEquals(password, options.Password);

    public AdminLoginResponse CreateToken()
    {
        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddMinutes(Math.Clamp(options.TokenLifetimeMinutes, 5, 1440));
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, options.Username),
            new Claim(ClaimTypes.Name, options.Username),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
        };
        var credentials = new SigningCredentials(
            CreateSigningKey(options.JwtSigningKey),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: "OpmWiki.Api",
            audience: "OpmWiki.Admin",
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new AdminLoginResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt,
            options.Username);
    }

    public static SymmetricSecurityKey CreateSigningKey(string signingKey) =>
        new(Encoding.UTF8.GetBytes(signingKey));

    private static bool FixedTimeEquals(string supplied, string expected)
    {
        var suppliedHash = SHA256.HashData(Encoding.UTF8.GetBytes(supplied ?? string.Empty));
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected ?? string.Empty));
        return CryptographicOperations.FixedTimeEquals(suppliedHash, expectedHash);
    }
}
