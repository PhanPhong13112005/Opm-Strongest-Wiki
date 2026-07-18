using OpmWiki.Api.Security;

namespace OpmWiki.Tests;

public sealed class AdminTokenServiceTests
{
    [Fact]
    public void CredentialsAndGeneratedToken_UseAdminIdentityAndExpiry()
    {
        var service = new AdminTokenService(new AdminAuthOptions
        {
            Username = "wiki-admin",
            Password = "correct horse battery staple",
            JwtSigningKey = "a-test-signing-key-that-is-longer-than-32-characters",
            TokenLifetimeMinutes = 30,
        });

        Assert.True(service.ValidateCredentials("wiki-admin", "correct horse battery staple"));
        Assert.False(service.ValidateCredentials("wiki-admin", "wrong"));

        var response = service.CreateToken();

        Assert.Equal("wiki-admin", response.Username);
        Assert.Equal(3, response.AccessToken.Split('.').Length);
        Assert.True(response.ExpiresAt > DateTimeOffset.UtcNow.AddMinutes(25));
    }
}
