namespace OpmWiki.Domain.Entities;

public static class AccountRoles
{
    public const string User = "User";
    public const string Staff = "Staff";
    public const string Admin = "Admin";
}

public static class TopUpStatuses
{
    public const string Pending = "Pending";
    public const string PaymentReported = "PaymentReported";
    public const string Cancelled = "Cancelled";
    public const string Expired = "Expired";
    public const string Paid = "Paid";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
}

public sealed class UserAccount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string NormalizedUsername { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PasswordResetTokenHash { get; set; }
    public DateTimeOffset? PasswordResetExpiresAt { get; set; }
    public string Role { get; set; } = AccountRoles.User;
    public decimal Balance { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class EventComment
{
    public long Id { get; set; }
    public string EventId { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public UserAccount User { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public Guid? DeletedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ForumTopic
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public UserAccount User { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsLocked { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<ForumPost> Posts { get; set; } = [];
}

public sealed class ForumPost
{
    public long Id { get; set; }
    public long TopicId { get; set; }
    public ForumTopic Topic { get; set; } = null!;
    public Guid UserId { get; set; }
    public UserAccount User { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public Guid? DeletedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class TopUpRequest
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public UserAccount User { get; set; } = null!;
    public string Provider { get; set; } = string.Empty;
    public string ReferenceCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = TopUpStatuses.Pending;
    public string StaffNote { get; set; } = string.Empty;
    public Guid? ReviewedById { get; set; }
    public UserAccount? ReviewedBy { get; set; }
    public string ReviewedBySubject { get; set; } = string.Empty;
    public DateTimeOffset? ReviewedAt { get; set; }
    public string ExternalTransactionId { get; set; } = string.Empty;
    public DateTimeOffset? PaidAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class PaymentTransaction
{
    public long Id { get; set; }
    public string Provider { get; set; } = "SePay";
    public string ExternalTransactionId { get; set; } = string.Empty;
    public long? TopUpRequestId { get; set; }
    public TopUpRequest? TopUpRequest { get; set; }
    public string Gateway { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string PaymentCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string TransferType { get; set; } = string.Empty;
    public string BankReferenceCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = "{}";
    public DateTimeOffset? TransactionAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class BalanceLedgerEntry
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public UserAccount User { get; set; } = null!;
    public long TopUpRequestId { get; set; }
    public TopUpRequest TopUpRequest { get; set; } = null!;
    public long PaymentTransactionId { get; set; }
    public PaymentTransaction PaymentTransaction { get; set; } = null!;
    public string EntryType { get; set; } = "BankTopUp";
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ReleaseScheduleEntry
{
    public long Id { get; set; }
    public string Server { get; set; } = "SEA";
    public DateOnly Date { get; set; }
    public string CharacterId { get; set; } = string.Empty;
    public string BannerImage { get; set; } = string.Empty;
    public bool IsReturn { get; set; }
    public string OverrideNameVi { get; set; } = string.Empty;
    public string OverrideNameEn { get; set; } = string.Empty;
    public string OverrideTier { get; set; } = string.Empty;
    public string OverrideFactionVi { get; set; } = string.Empty;
    public string OverrideFactionEn { get; set; } = string.Empty;
    public string OverrideTypeVi { get; set; } = string.Empty;
    public string OverrideTypeEn { get; set; } = string.Empty;
    public string OverrideRoleVi { get; set; } = string.Empty;
    public string OverrideRoleEn { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
