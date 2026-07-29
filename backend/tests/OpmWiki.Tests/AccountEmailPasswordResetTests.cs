using Microsoft.EntityFrameworkCore;
using OpmWiki.Api.Services;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class AccountEmailPasswordResetTests
{
    [Fact]
    public async Task GmailIsUniqueAndCanResolveLoginIdentifier()
    {
        await using var dbContext = CreateContext();
        var repository = new CommunityRepository(dbContext);

        var account = await repository.CreateUserWithEmailAsync(
            "gmail-user",
            "Gmail.User@gmail.com",
            "Gmail User",
            "initial-hash");

        Assert.NotNull(account);
        Assert.Equal("gmailuser@gmail.com", account!.NormalizedEmail);
        Assert.Null(await repository.CreateUserWithEmailAsync(
            "another-user",
            "gmailuser+another@gmail.com",
            "Another User",
            "initial-hash"));

        var found = await repository.FindUserByIdentifierAsync(
            "GMAIL.USER@GMAIL.COM",
            "gmail.user@gmail.com");
        Assert.Equal(account.Id, found?.Id);
    }

    [Fact]
    public async Task PasswordResetTokenExpiresAndCanOnlyBeUsedOnce()
    {
        await using var dbContext = CreateContext();
        var repository = new CommunityRepository(dbContext);
        var account = await repository.CreateUserWithEmailAsync(
            "reset-user",
            "reset.user@gmail.com",
            "Reset User",
            "initial-hash");
        Assert.NotNull(account);

        var token = PasswordResetTokens.Create();
        var tokenHash = PasswordResetTokens.Hash(token);
        Assert.NotEqual(token, tokenHash);

        var requested = await repository.SetPasswordResetTokenAsync(
            "reset.user@gmail.com",
            tokenHash,
            DateTimeOffset.UtcNow.AddMinutes(15));
        Assert.Equal(account!.Id, requested?.Id);

        Assert.True(await repository.ResetPasswordAsync(tokenHash, "replacement-hash"));
        Assert.False(await repository.ResetPasswordAsync(tokenHash, "replayed-hash"));
        Assert.Equal("replacement-hash", (await repository.FindUserByIdAsync(account.Id))?.PasswordHash);

        var expiredHash = PasswordResetTokens.Hash(PasswordResetTokens.Create());
        await repository.SetPasswordResetTokenAsync(
            "reset.user@gmail.com",
            expiredHash,
            DateTimeOffset.UtcNow.AddMinutes(-1));
        Assert.False(await repository.ResetPasswordAsync(expiredHash, "expired-hash"));
    }

    private static OpmWikiDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new OpmWikiDbContext(options);
    }
}
