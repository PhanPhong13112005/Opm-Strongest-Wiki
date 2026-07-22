using OpmWiki.Application.Community;
using OpmWiki.Domain.Entities;

namespace OpmWiki.Application.Abstractions;

public interface ICommunityRepository
{
    Task<UserAccount?> FindUserByUsernameAsync(string normalizedUsername, CancellationToken cancellationToken = default);
    Task<UserAccount?> FindUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserAccount?> CreateUserAsync(string username, string displayName, string passwordHash, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AccountDto>> ListAccountsAsync(CancellationToken cancellationToken = default);
    Task<AccountDto?> UpdateAccountRoleAsync(Guid id, string role, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EventCommentDto>> ListEventCommentsAsync(string eventId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EventCommentDto>> ListRecentEventCommentsAsync(CancellationToken cancellationToken = default);
    Task<EventCommentDto?> AddEventCommentAsync(string eventId, Guid userId, string content, CancellationToken cancellationToken = default);
    Task<bool> DeleteEventCommentAsync(long id, Guid moderatorId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ForumTopicSummaryDto>> ListForumTopicsAsync(CancellationToken cancellationToken = default);
    Task<ForumTopicDetailDto?> GetForumTopicAsync(long id, CancellationToken cancellationToken = default);
    Task<ForumTopicDetailDto> CreateForumTopicAsync(Guid userId, string title, string content, CancellationToken cancellationToken = default);
    Task<ForumPostDto?> AddForumPostAsync(long topicId, Guid userId, string content, CancellationToken cancellationToken = default);
    Task<bool> DeleteForumTopicAsync(long id, Guid moderatorId, CancellationToken cancellationToken = default);
    Task<bool> DeleteForumPostAsync(long id, Guid moderatorId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TopUpRequestDto>> ListUserTopUpsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<TopUpRequestDto> CreateTopUpAsync(Guid userId, string provider, string referenceCode, decimal amount, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TopUpRequestDto>> ListTopUpsAsync(string? status, CancellationToken cancellationToken = default);
    Task<TopUpRequestDto?> ReviewTopUpAsync(long id, Guid reviewerId, string status, string staffNote, CancellationToken cancellationToken = default);

    Task<DashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default);
    Task<AdvisorContextDto> FindAdvisorContextAsync(string query, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminEventDto>> ListAdminEventsAsync(CancellationToken cancellationToken = default);
    Task<AdminEventDto?> CreateAdminEventAsync(AdminEventWriteRequest request, CancellationToken cancellationToken = default);
    Task<AdminEventDto?> UpdateAdminEventAsync(string id, AdminEventWriteRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAdminEventAsync(string id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ReleaseScheduleDto>> ListReleaseScheduleAsync(string language, CancellationToken cancellationToken = default);
    Task<ReleaseScheduleDto> CreateReleaseScheduleAsync(ReleaseScheduleWriteRequest request, CancellationToken cancellationToken = default);
    Task<ReleaseScheduleDto?> UpdateReleaseScheduleAsync(long id, ReleaseScheduleWriteRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteReleaseScheduleAsync(long id, CancellationToken cancellationToken = default);
}
