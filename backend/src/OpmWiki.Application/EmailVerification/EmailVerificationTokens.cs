using System.Security.Cryptography;
using System.Text;

namespace OpmWiki.Application.EmailVerification;

public static class EmailVerificationTokens
{
    public static string Create()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token ?? string.Empty)))
            .ToLowerInvariant();
}
