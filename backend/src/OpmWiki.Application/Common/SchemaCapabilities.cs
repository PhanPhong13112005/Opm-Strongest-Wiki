namespace OpmWiki.Application.Common;

public enum SchemaCapability
{
    TierRanking,
    EmailVerification,
}

public sealed record SchemaCapabilityResult(
    bool IsAvailable,
    string Code,
    string Detail)
{
    public static SchemaCapabilityResult Available() => new(true, "Available", string.Empty);

    public static SchemaCapabilityResult Missing(string detail) =>
        new(false, "SchemaNotReady", detail);
}

public interface ISchemaCapabilityService
{
    Task<SchemaCapabilityResult> CheckAsync(
        SchemaCapability capability,
        CancellationToken cancellationToken = default);
}
