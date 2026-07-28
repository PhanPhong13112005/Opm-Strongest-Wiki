using System.ComponentModel.DataAnnotations;

namespace OpmWiki.Application.Community;

public sealed record AccountDto(
    Guid Id,
    string Username,
    string DisplayName,
    string Role,
    decimal Balance,
    bool IsActive,
    DateTimeOffset CreatedAt);

public sealed record RegisterRequest(string Username, string DisplayName, string Password);
public sealed record LoginRequest(string Username, string Password);
public sealed record UpdateAccountRoleRequest(string Role);
public sealed record UpdateAccountStatusRequest(
    [property: Required(ErrorMessage = "Trạng thái tài khoản là bắt buộc.")]
    bool? IsActive);

public sealed record EventCommentDto(
    long Id,
    string EventId,
    Guid UserId,
    string DisplayName,
    string Role,
    string Content,
    DateTimeOffset CreatedAt);

public sealed record CreateCommentRequest(string Content);

public sealed record ForumTopicSummaryDto(
    long Id,
    string Title,
    string Author,
    string AuthorRole,
    int PostCount,
    bool IsLocked,
    DateTimeOffset UpdatedAt);

public sealed record ForumPostDto(
    long Id,
    Guid UserId,
    string Author,
    string AuthorRole,
    string Content,
    DateTimeOffset CreatedAt);

public sealed record ForumTopicDetailDto(
    long Id,
    string Title,
    string Content,
    string Author,
    string AuthorRole,
    bool IsLocked,
    DateTimeOffset CreatedAt,
    IReadOnlyList<ForumPostDto> Posts);

public sealed record CreateForumTopicRequest(string Title, string Content);
public sealed record CreateForumPostRequest(string Content);

public sealed record TopUpRequestDto(
    long Id,
    Guid UserId,
    string Username,
    string DisplayName,
    string Provider,
    string ReferenceCode,
    decimal Amount,
    string Status,
    string StaffNote,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset? PaidAt,
    string ExternalTransactionId);

public sealed record AdminTopUpRequestDto(
    long Id,
    Guid UserId,
    string Username,
    string DisplayName,
    string Provider,
    string ReferenceCode,
    decimal Amount,
    string Status,
    string StaffNote,
    string ReviewedBySubject,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset? PaidAt,
    string ExternalTransactionId);

public sealed record CreateTopUpRequest(string Provider, string ReferenceCode, decimal Amount);
public sealed record TopUpCreationResult(TopUpRequestDto TopUp, bool Created);
public sealed record UpdateCouponOrderRequest(string Action);
public sealed record CreateBankTopUpQrRequest(decimal Amount);
public sealed record UpdateBankPaymentRequest(string Action);
public sealed record BankTransferDetailsDto(string BankId, string AccountNumber, string AccountName);
public sealed record BankTopUpQrDto(
    TopUpRequestDto TopUp,
    BankTransferDetailsDto Bank,
    string QrUrl,
    DateTimeOffset ExpiresAt);
public sealed record ReviewTopUpRequest(string Status, string StaffNote);

public enum TopUpReviewFailure
{
    None,
    NotReviewable,
    InvalidCouponOrder,
    SelfReview,
}
public sealed record TopUpReviewResult(
    AdminTopUpRequestDto? TopUp,
    TopUpReviewFailure Failure);

public sealed record SePayWebhookTransaction(
    string ExternalTransactionId,
    string Gateway,
    string AccountNumber,
    string PaymentCode,
    decimal Amount,
    string TransferType,
    string BankReferenceCode,
    string PayloadJson,
    DateTimeOffset? TransactionAt);
public sealed record PaymentProcessingResult(
    bool Duplicate,
    bool Credited,
    long? TopUpRequestId,
    string Status);

public sealed record DashboardDto(
    int Users,
    int Staff,
    int Admins,
    int EventComments,
    int ForumTopics,
    int ForumPosts,
    int PendingTopUps,
    int Characters,
    int Events,
    int ReleaseEntries);

public sealed record ReleaseScheduleDto(
    long Id,
    string Server,
    DateOnly Date,
    string CharacterId,
    string BannerImage,
    bool IsReturn,
    string OverrideName,
    string OverrideTier,
    string OverrideFaction,
    string OverrideType,
    string OverrideRole,
    string OverrideNameVi,
    string OverrideNameEn,
    string OverrideFactionVi,
    string OverrideFactionEn,
    string OverrideTypeVi,
    string OverrideTypeEn,
    string OverrideRoleVi,
    string OverrideRoleEn,
    int SortOrder);

public sealed record ReleaseScheduleWriteRequest(
    string Server,
    DateOnly Date,
    string CharacterId,
    string BannerImage,
    bool IsReturn,
    string OverrideNameVi,
    string OverrideNameEn,
    string OverrideTier,
    string OverrideFactionVi,
    string OverrideFactionEn,
    string OverrideTypeVi,
    string OverrideTypeEn,
    string OverrideRoleVi,
    string OverrideRoleEn,
    int SortOrder);

public sealed record AdvisorContextDto(
    IReadOnlyList<string> Characters,
    IReadOnlyList<string> Events);

public sealed record AdvisorRequest(string Question);
public sealed record AdvisorResponse(string Answer, string Source);

public sealed record AdminEventDto(
    string Id,
    string TitleVi,
    string TitleEn,
    string DescriptionVi,
    string DescriptionEn,
    string Category,
    string ImageUrl,
    IReadOnlyList<string> DetailImages,
    string SectionsJson,
    DateOnly StartDate,
    DateOnly EndDate,
    DateTimeOffset UpdatedAt);

public sealed record AdminEventWriteRequest(
    string Id,
    string TitleVi,
    string TitleEn,
    string DescriptionVi,
    string DescriptionEn,
    string Category,
    string ImageUrl,
    IReadOnlyList<string> DetailImages,
    string SectionsJson,
    DateOnly StartDate,
    DateOnly EndDate);
