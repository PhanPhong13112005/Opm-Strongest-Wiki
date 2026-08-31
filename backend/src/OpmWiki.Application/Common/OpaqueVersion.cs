using System.Buffers.Binary;

namespace OpmWiki.Application.Common;

public static class OpaqueVersion
{
    private const string TimestampPrefix = "t1.";
    private const string SequencePrefix = "s1.";

    public static string FromTimestamp(DateTimeOffset timestamp) =>
        TimestampPrefix + EncodeInt64(timestamp.ToUniversalTime().Ticks);

    public static bool TryGetTimestamp(string? value, out DateTimeOffset timestamp)
    {
        timestamp = default;
        if (!TryDecodeInt64(value, TimestampPrefix, out var ticks) ||
            ticks < DateTimeOffset.MinValue.Ticks || ticks > DateTimeOffset.MaxValue.Ticks)
            return false;

        timestamp = new DateTimeOffset(ticks, TimeSpan.Zero);
        return true;
    }

    public static string FromSequence(long sequence) =>
        SequencePrefix + EncodeInt64(sequence);

    public static bool TryGetSequence(string? value, out long sequence) =>
        TryDecodeInt64(value, SequencePrefix, out sequence) && sequence >= 0;

    public static string NormalizeEntityTag(string value)
    {
        var normalized = value.Trim();
        if (normalized.StartsWith("W/", StringComparison.OrdinalIgnoreCase))
            normalized = normalized[2..].Trim();
        return normalized.Length >= 2 && normalized[0] == '"' && normalized[^1] == '"'
            ? normalized[1..^1]
            : normalized;
    }

    private static string EncodeInt64(long value)
    {
        Span<byte> bytes = stackalloc byte[sizeof(long)];
        BinaryPrimitives.WriteInt64BigEndian(bytes, value);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static bool TryDecodeInt64(string? value, string prefix, out long decoded)
    {
        decoded = 0;
        if (string.IsNullOrWhiteSpace(value)) return false;
        var normalized = NormalizeEntityTag(value);
        if (!normalized.StartsWith(prefix, StringComparison.Ordinal)) return false;

        var encoded = normalized[prefix.Length..].Replace('-', '+').Replace('_', '/');
        encoded = encoded.PadRight((encoded.Length + 3) / 4 * 4, '=');
        try
        {
            var bytes = Convert.FromBase64String(encoded);
            if (bytes.Length != sizeof(long)) return false;
            decoded = BinaryPrimitives.ReadInt64BigEndian(bytes);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
