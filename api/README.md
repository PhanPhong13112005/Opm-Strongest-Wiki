# Vercel Functions API — LEGACY / TRANSITIONAL

Thư mục này ghi lại Node/Vercel Functions đang tồn tại để hỗ trợ transition và rollback có kiểm soát.
Nó **không phải authoritative production backend cuối cùng**. Kiến trúc đã freeze chọn ASP.NET Core
làm final backend, EF Core làm migration owner duy nhất, và ASP.NET làm auth/payment/ledger owner duy nhất.
Permanent split bị từ chối; final frontend dùng `VITE_API_BASE_URL` trỏ tới một ASP.NET origin.

Các route dưới đây là inventory implementation hiện tại, không phải cam kết rằng Node sẽ còn nhận traffic
sau cutover. Xem [`docs/PRODUCTION_ARCHITECTURE.md`](../docs/PRODUCTION_ARCHITECTURE.md) và
[`docs/API_OWNERSHIP.md`](../docs/API_OWNERSHIP.md).

## Endpoint đã chuyển

- `/api/health`, `/api/health/database`
- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `/api/events/:eventId/comments`
- `/api/forum/topics`, `/api/forum/topics/:id`, `/api/forum/topics/:id/posts`
- `/api/top-ups`, `/api/top-ups/mine` (`POST` trả `201` khi tạo mới, `200` khi replay cùng reference/payload và `409` nếu reference đã dùng cho payload khác)
- `PUT /api/top-ups/:id/coupon-order` (User hủy đơn Coupon của chính mình khi còn chờ)
- `/api/admin/top-ups`, `/api/admin/top-ups/:id/review` (Admin; `/api/staff/top-ups*` được giữ làm alias tương thích ngược)
- `/api/moderation/comments`, `/api/moderation/forum/*`
- `/api/admin/dashboard`, `/api/admin/users`, `/api/admin/users/:id/role`, `/api/admin/users/:id/status`
- `/api/admin/characters/*`, `/api/admin/keepsakes/*`
- `/api/admin/events/*`, `/api/admin/releases/*`
- `/api/characters`, `/api/characters/:id` (public, dữ liệu Neon, song ngữ VI/EN)
- `/api/events`, `/api/events/:id` (public, dữ liệu Neon, song ngữ VI/EN)
- `/api/release-schedule` (public, song ngữ VI/EN)
- `/api/advisor/ask` (tra cứu dữ liệu Wiki nội bộ)

Khi Admin duyệt coupon, API lưu JWT subject vào `ReviewedBySubject`. Admin cấu hình môi trường dùng subject `admin:<username>`; Admin database vẫn giữ thêm `ReviewedById` khi có UUID hợp lệ. Trường audit chỉ xuất hiện trong response Admin, không được trả qua lịch sử top-up của User.

API từ chối yêu cầu `Rejected` nếu thiếu `staffNote`; ghi chú được trim và giới hạn 500 ký tự. Admin database không được review đơn có `UserId` trùng `ReviewedById`; preflight trả lỗi self-review rõ ràng và điều kiện vẫn nằm trong SQL update. Trước `Approved`, handler kiểm tra lại format UID/SID/CP/QTY và `Amount = 13.000 × QTY`; bản ghi legacy sai dữ liệu chỉ có thể bị từ chối. Đơn không tồn tại, đã xử lý hoặc bị hủy trả lỗi riêng với dữ liệu sai và self-review.

Admin có thể bật/tắt `IsActive` qua endpoint `/api/admin/users/:id/status`; payload bắt buộc có `isActive` kiểu boolean. Admin database không được tự đổi role hoặc tự vô hiệu hóa. Mọi route bảo vệ đối chiếu lại `IsActive` và `Role` từ PostgreSQL trước khi kiểm tra quyền endpoint: account thiếu/inactive hoặc token mang role cũ trả `401`, còn identity hợp lệ nhưng thiếu quyền trả `403`. Admin cấu hình môi trường có subject `admin:*` không phụ thuộc bản ghi database.

Nhân vật, Sự kiện và Lịch ra mắt CN/SEA được đọc trực tiếp từ PostgreSQL/Neon. Các endpoint
công khai trả cache header cho trình duyệt và CDN; frontend vẫn giữ JSON tĩnh làm fallback khi
API hoặc cơ sở dữ liệu tạm thời không khả dụng.

## Biến môi trường Node/Vercel trong giai đoạn transition

Chỉ khi một transitional Vercel deployment được phê duyệt, thiết lập cho scope tương ứng:

```text
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require
ADMINAUTH__USERNAME=admin
ADMINAUTH__PASSWORD=<mật khẩu quản trị mạnh>
ADMINAUTH__JWTSIGNINGKEY=<chuỗi ngẫu nhiên tối thiểu 32 ký tự>
PUBLIC_APP_URL=https://<domain>
EMAIL__RESENDAPIKEY=<Resend API key>
EMAIL__FROM=OPM Wiki <no-reply@<verified-domain>>
PASSWORDRESET__TOKENLIFETIMEMINUTES=15
```

Đăng ký yêu cầu Gmail `@gmail.com`; hệ thống chuẩn hóa dấu chấm và phần `+tag` để một hộp thư
không tạo nhiều tài khoản. Endpoint quên mật khẩu luôn trả phản hồi chung, chỉ lưu SHA-256 của
token, token hết hạn sau 15 phút và bị xóa ngay khi dùng thành công. Resend cần sender domain đã
xác minh; local không gửi email thật và có thể trả `resetUrl` để kiểm thử.

Có thể dùng connection string kiểu .NET qua `CONNECTIONSTRINGS__OPMWIKI` thay cho
`DATABASE_URL`. Không cần đặt đồng thời cả hai.

Không thêm tiền tố `VITE_` cho secret server. Các biến Node này chỉ áp dụng nếu một transition/rollback
được phê duyệt; direct ASP.NET deployment dùng matrix trong [`docs/CONFIGURATION.md`](../docs/CONFIGURATION.md),
bao gồm exact key `PublicAppUrl`.

Public `GET` Node hiện không tự thay đổi schema, nhưng một số write route legacy vẫn có logic bảo đảm bảng.
Đây không phải migration authority cuối cùng. Trước cutover, Node runtime DDL và mọi Node writer phải bị
loại khỏi request path; schema production chỉ thay đổi bằng EF migration từ CI/CD release migration job.
Các bảng dùng chung giữ định dạng PBKDF2/JWT tương thích trong transition; xem
[`docs/BACKEND_PARITY.md`](../docs/BACKEND_PARITY.md).

## Kiểm tra transitional deployment đã được phê duyệt

```text
GET  https://<domain>/api/health
GET  https://<domain>/api/health/database
POST https://<domain>/api/auth/register
POST https://<domain>/api/auth/login
POST https://<domain>/api/auth/forgot-password
POST https://<domain>/api/auth/reset-password
```

Không dùng checklist này để deploy Node như backend authority mới. Không commit connection string, mật khẩu
hoặc JWT signing key vào Git. Final cutover verification nằm trong
[`docs/DEPLOYMENT_RUNBOOK.md`](../docs/DEPLOYMENT_RUNBOOK.md).
