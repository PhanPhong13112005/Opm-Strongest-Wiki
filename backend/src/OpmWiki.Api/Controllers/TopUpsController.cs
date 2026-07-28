using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using OpmWiki.Api.Security;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;
using OpmWiki.Domain.Entities;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/top-ups")]
public sealed class TopUpsController(
    ICommunityRepository repository,
    IConfiguration configuration) : ControllerBase
{
    private static readonly Regex BankIdPattern = new(
        @"^[A-Za-z0-9]{2,20}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly Regex BankAccountPattern = new(
        @"^[A-Za-z0-9]{6,19}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly Regex CouponReferencePattern = new(
        @"^UID:\d{5,20}\|SID:[A-Za-z0-9_-]{1,20}\|CP:6\|QTY:(10|[1-9])\|[A-Z0-9]+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private const string CouponOrderProvider = "Coupon Order";
    private const decimal CouponUnitPrice = 13_000;
    private static readonly TimeSpan BankPaymentWindow = TimeSpan.FromMinutes(5);

    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<TopUpRequestDto>>> Mine(CancellationToken cancellationToken)
    {
        var userId = User.GetAccountId();
        if (userId == Guid.Empty)
            return Ok(Array.Empty<TopUpRequestDto>());

        await repository.ExpirePendingBankTopUpsAsync(
            DateTimeOffset.UtcNow.Subtract(BankPaymentWindow), userId, cancellationToken);
        return Ok(await repository.ListUserTopUpsAsync(userId, cancellationToken));
    }

    [HttpPost("bank-qr")]
    public async Task<ActionResult<BankTopUpQrDto>> CreateBankQr(
        CreateBankTopUpQrRequest request,
        CancellationToken cancellationToken)
    {
        if (decimal.Truncate(request.Amount) != request.Amount ||
            request.Amount is < 10_000 or > 100_000_000)
        {
            return BadRequest(new
            {
                message = "Số tiền phải là số nguyên từ 10.000 đến 100.000.000.",
            });
        }

        var bank = ReadBankTransferDetails();
        if (bank is null)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Kênh chuyển khoản ngân hàng chưa được cấu hình.",
            });
        }

        var userId = User.GetAccountId();
        if (userId == Guid.Empty)
            return BadRequest(new { message = "Hãy dùng tài khoản người dùng để nạp." });

        var referenceCode = $"OPM{Guid.NewGuid():N}"[..15].ToUpperInvariant();
        try
        {
            var topUp = await repository.CreateTopUpAsync(
                userId, "Bank transfer", referenceCode, request.Amount, cancellationToken);
            return Created(
                $"/api/top-ups/{topUp.Id}",
                CreateBankQrResponse(topUp, bank));
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            return Conflict(new { message = "Không thể tạo mã chuyển khoản. Vui lòng thử lại." });
        }
    }

    [HttpGet("{id:long}/bank-qr")]
    public async Task<ActionResult<BankTopUpQrDto>> GetBankQr(
        long id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetAccountId();
        if (userId == Guid.Empty)
            return NotFound(new { message = "Không tìm thấy yêu cầu thanh toán." });

        var topUp = await repository.GetUserTopUpAsync(id, userId, cancellationToken);
        if (topUp is null || topUp.Provider != "Bank transfer")
            return NotFound(new { message = "Không tìm thấy yêu cầu thanh toán." });

        topUp = await ExpireBankPaymentAsync(topUp, userId, cancellationToken);
        var bank = ReadBankTransferDetails();
        if (bank is null)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Kênh chuyển khoản ngân hàng chưa được cấu hình.",
            });
        }
        return Ok(CreateBankQrResponse(topUp, bank));
    }

    [HttpPut("{id:long}/bank-payment")]
    public async Task<ActionResult<TopUpRequestDto>> UpdateBankPayment(
        long id,
        UpdateBankPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var action = request.Action?.Trim().ToLowerInvariant() ?? string.Empty;
        if (action != "cancel")
            return BadRequest(new { message = "Hành động thanh toán không hợp lệ." });

        var userId = User.GetAccountId();
        var topUp = userId == Guid.Empty
            ? null
            : await repository.GetUserTopUpAsync(id, userId, cancellationToken);
        if (topUp is null || topUp.Provider != "Bank transfer")
            return NotFound(new { message = "Không tìm thấy yêu cầu thanh toán." });

        topUp = await ExpireBankPaymentAsync(topUp, userId, cancellationToken);
        if (topUp.Status == TopUpStatuses.Cancelled)
            return Ok(topUp);
        if (topUp.Status is not (TopUpStatuses.Pending or TopUpStatuses.PaymentReported))
            return Conflict(new { message = "Yêu cầu thanh toán không còn có thể cập nhật." });

        var updated = await repository.UpdateUserTopUpStatusAsync(
            id, userId, topUp.Status, TopUpStatuses.Cancelled, cancellationToken);
        return updated is null
            ? Conflict(new { message = "Trạng thái vừa được cập nhật ở nơi khác. Vui lòng tải lại." })
            : Ok(updated);
    }

    [HttpPost]
    public async Task<ActionResult<TopUpRequestDto>> Create(
        CreateTopUpRequest request,
        CancellationToken cancellationToken)
    {
        var provider = request.Provider?.Trim() ?? string.Empty;
        var reference = request.ReferenceCode?.Trim() ?? string.Empty;
        if (provider != CouponOrderProvider)
            return BadRequest(new { message = "Phương thức nạp không được hỗ trợ." });
        if (reference.Length is < 4 or > 120 || reference.Any(char.IsControl))
            return BadRequest(new { message = "Mã giao dịch phải có 4-120 ký tự hợp lệ." });
        if (request.Amount is < 10_000 or > 100_000_000)
            return BadRequest(new { message = "Số tiền phải từ 10.000 đến 100.000.000." });
        var couponMatch = CouponReferencePattern.Match(reference);
        if (!couponMatch.Success)
            return BadRequest(new { message = "Thông tin đơn Coupon không hợp lệ." });
        if (request.Amount != CouponUnitPrice * int.Parse(couponMatch.Groups[1].Value))
            return BadRequest(new { message = "Giá trị đơn Coupon không hợp lệ." });
        var userId = User.GetAccountId();
        if (userId == Guid.Empty) return BadRequest(new { message = "Hãy dùng tài khoản người dùng để nạp." });

        try
        {
            var result = await repository.CreateTopUpAsync(userId, provider, reference, request.Amount, cancellationToken);
            return Created($"/api/top-ups/{result.Id}", result);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            return Conflict(new { message = "Mã giao dịch này đã được gửi trước đó." });
        }
    }

    private BankTransferDetailsDto? ReadBankTransferDetails()
    {
        var bankId = configuration["BankTransfer:BankId"]?.Trim() ?? string.Empty;
        var accountNumber = configuration["BankTransfer:AccountNumber"]?.Trim() ?? string.Empty;
        var accountName = configuration["BankTransfer:AccountName"]?.Trim() ?? string.Empty;
        return BankIdPattern.IsMatch(bankId) &&
               BankAccountPattern.IsMatch(accountNumber) &&
               accountName.Length is >= 2 and <= 80 &&
               !accountName.Any(char.IsControl)
            ? new BankTransferDetailsDto(bankId, accountNumber, accountName)
            : null;
    }

    private static string CreateBankQrUrl(BankTransferDetailsDto bank, TopUpRequestDto topUp)
    {
        var query = new Dictionary<string, string?>
        {
            ["amount"] = decimal.Truncate(topUp.Amount).ToString(
                System.Globalization.CultureInfo.InvariantCulture),
            ["addInfo"] = topUp.ReferenceCode,
            ["accountName"] = bank.AccountName,
        };
        return $"https://img.vietqr.io/image/{bank.BankId}-{bank.AccountNumber}-compact2.png" +
               QueryString.Create(query);
    }

    private static BankTopUpQrDto CreateBankQrResponse(
        TopUpRequestDto topUp,
        BankTransferDetailsDto bank) =>
        new(topUp, bank, CreateBankQrUrl(bank, topUp), topUp.CreatedAt.Add(BankPaymentWindow));

    private async Task<TopUpRequestDto> ExpireBankPaymentAsync(
        TopUpRequestDto topUp,
        Guid userId,
        CancellationToken cancellationToken)
    {
        if (topUp.Status != TopUpStatuses.Pending ||
            topUp.CreatedAt.Add(BankPaymentWindow) > DateTimeOffset.UtcNow)
            return topUp;

        return await repository.UpdateUserTopUpStatusAsync(
                   topUp.Id,
                   userId,
                   TopUpStatuses.Pending,
                   TopUpStatuses.Expired,
                   cancellationToken)
               ?? await repository.GetUserTopUpAsync(topUp.Id, userId, cancellationToken)
               ?? topUp;
    }
}

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/staff/top-ups")]
public sealed class StaffTopUpsController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TopUpRequestDto>>> List(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(status) && status is not (TopUpStatuses.Pending or TopUpStatuses.Approved or TopUpStatuses.Rejected))
            return BadRequest(new { message = "Trạng thái không hợp lệ." });
        return Ok(await repository.ListTopUpsAsync(status, cancellationToken));
    }

    [HttpPut("{id:long}/review")]
    public async Task<ActionResult<TopUpRequestDto>> Review(
        long id,
        ReviewTopUpRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Status is not (TopUpStatuses.Approved or TopUpStatuses.Rejected))
            return BadRequest(new { message = "Chỉ có thể duyệt hoặc từ chối yêu cầu." });
        if ((request.StaffNote?.Length ?? 0) > 500)
            return BadRequest(new { message = "Ghi chú không được vượt quá 500 ký tự." });
        var result = await repository.ReviewTopUpAsync(
            id, User.GetAccountId(), request.Status, request.StaffNote ?? string.Empty, cancellationToken);
        return result is null
            ? Conflict(new { message = "Yêu cầu không tồn tại hoặc đã được xử lý." })
            : Ok(result);
    }
}
