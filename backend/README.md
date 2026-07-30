# OPM Strongest Wiki Backend

Backend ASP.NET Core cung cấp API dữ liệu cho frontend Vue hiện tại. Frontend vẫn tiếp tục đọc JSON cho đến khi từng màn hình được chuyển sang API.

## Kiến trúc

```text
OpmWiki.Api            HTTP, Swagger, CORS, health checks
OpmWiki.Application    DTO, truy vấn và abstraction
OpmWiki.Domain         Entity và quy tắc dữ liệu cốt lõi
OpmWiki.Infrastructure EF Core, PostgreSQL, repository, nhập JSON
OpmWiki.Tests          Kiểm thử tự động
```

Luồng phụ thuộc:

```text
Api -> Application <- Infrastructure -> Domain
```

## Yêu cầu

- .NET SDK 10
- PostgreSQL, hoặc Docker Desktop

## Chạy local

Từ thư mục `backend`:

```powershell
Copy-Item .env.example .env
docker compose up -d database
dotnet tool restore
dotnet ef database update --project src/OpmWiki.Infrastructure --startup-project src/OpmWiki.Api
dotnet run --project src/OpmWiki.Api -- --seed-data
dotnet run --project src/OpmWiki.Api --urls http://localhost:5180
```

Swagger: `http://localhost:5180/swagger`

Hướng dẫn production: [`DEPLOYMENT.md`](DEPLOYMENT.md).
Đánh giá và runbook Giai đoạn 1: [`../docs/BACKEND_PRODUCTION_PHASE_1.md`](../docs/BACKEND_PRODUCTION_PHASE_1.md).

Nếu muốn chạy cả API và PostgreSQL bằng Docker:

```powershell
docker compose up --build
docker compose exec api dotnet OpmWiki.Api.dll --seed-data
```

## API ban đầu

| Method | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra API |
| `GET` | `/api/health/database` | Kiểm tra PostgreSQL |
| `GET` | `/api/characters` | Danh sách, tìm kiếm, lọc và phân trang nhân vật |
| `GET` | `/api/characters/{id}` | Chi tiết nhân vật |
| `GET` | `/api/events` | Danh sách, lọc thời gian và phân trang sự kiện |
| `GET` | `/api/events/{id}` | Chi tiết sự kiện |
| `GET` | `/api/mastery` | Cấu hình 3 nhánh và 33 mốc Tinh Thông |
| `GET` | `/api/keepsakes` | Danh sách, tìm kiếm, lọc và phân trang Kỷ vật |
| `GET` | `/api/keepsakes/{id}` | Chi tiết Kỷ vật theo nhân vật |
| `GET` | `/api/insignias` | Danh sách 10 Huy Hiệu hợp lệ, hỗ trợ tìm kiếm và phân trang |
| `GET` | `/api/insignias/{id}` | Chi tiết Huy Hiệu và các hướng dẫn nhận theo thứ tự |
| `GET` | `/api/backgears` | Danh mục Thẻ Hình nền, cấp nâng, chỉ số và Bộ Sưu Tập |
| `GET` | `/api/tactics` | Danh mục Thẻ Chiến thuật, chỉ số sao và Khung Chiến thuật |
| `POST` | `/api/admin/auth/login` | Đăng nhập quản trị, trả JWT ngắn hạn |
| `GET/POST` | `/api/admin/characters` | Danh sách hoặc tạo Nhân vật (yêu cầu quyền Admin) |
| `GET/PUT/DELETE` | `/api/admin/characters/{id}` | Xem, sửa hoặc xóa Nhân vật (yêu cầu quyền Admin) |
| `PUT/DELETE` | `/api/admin/keepsakes/{characterId}` | Gắn, đổi hoặc gỡ Kỷ vật của Nhân vật |
| `POST` | `/api/auth/register`, `/api/auth/login` | Đăng ký hoặc đăng nhập tài khoản cộng đồng |
| `GET/POST` | `/api/events/{eventId}/comments` | Xem hoặc gửi bình luận sự kiện |
| `GET/POST` | `/api/forum/topics` | Danh sách hoặc tạo chủ đề diễn đàn |
| `POST` | `/api/forum/topics/{id}/posts` | Gửi phản hồi trong chủ đề |
| `GET/POST` | `/api/top-ups/mine`, `/api/top-ups` | Theo dõi hoặc gửi đơn Coupon; POST trả `201` khi tạo mới, `200` khi replay cùng reference/payload và `409` nếu reference đã dùng cho payload khác |
| `PUT` | `/api/top-ups/{id}/coupon-order` | User hủy đơn Coupon của chính mình khi còn chờ; update có kiểm tra trạng thái |
| `POST` | `/api/top-ups/bank-qr` | Tạo yêu cầu chuyển khoản và mã VietQR |
| `GET/PUT` | `/api/top-ups/{id}/bank-qr`, `/api/top-ups/{id}/bank-payment` | Xem chi tiết hoặc hủy thanh toán ngân hàng |
| `POST` | `/api/webhooks/sepay` | SePay xác thực HMAC, đối soát và cộng số dư idempotent |
| `GET/PUT` | `/api/admin/top-ups` | Admin liệt kê và duyệt/từ chối đơn Coupon; chặn self-review, bắt buộc lý do khi từ chối, chỉ cho duyệt khi UID/SID/QTY/giá trị hợp lệ và trả phản hồi riêng cho từng lỗi nghiệp vụ; `/api/staff/top-ups` là alias tương thích ngược, Staff vẫn bị từ chối |
| `GET/DELETE` | `/api/moderation/comments` | Nhân viên kiểm duyệt bình luận |
| `DELETE` | `/api/moderation/forum/topics/{id}`, `/api/moderation/forum/posts/{id}` | Nhân viên xóa chủ đề hoặc phản hồi vi phạm |
| `GET` | `/api/admin/dashboard` | Thống kê toàn hệ thống |
| `GET/PUT` | `/api/admin/users`, `/api/admin/users/{id}/role`, `/api/admin/users/{id}/status` | Danh sách, phân vai trò và bật/tắt tài khoản; `isActive` bắt buộc là boolean; Admin database không được tự đổi role hoặc tự vô hiệu hóa |
| `GET/POST/PUT/DELETE` | `/api/admin/events` | CRUD nội dung sự kiện |
| `GET` | `/api/release-schedule` | Lịch ra mắt CN/SEA công khai trên trang chủ |
| `GET/POST/PUT/DELETE` | `/api/admin/releases` | Quản trị lịch ra mắt tướng CN/SEA |
| `POST` | `/api/advisor/ask` | Tư vấn từ dữ liệu Wiki, dùng AI ngoài khi được cấu hình |

Các endpoint dữ liệu hỗ trợ `language=vi` hoặc `language=en`.

Ví dụ:

```text
/api/characters?language=vi&tier=UR%2B&sort=release_desc&page=1&pageSize=12
/api/characters/100013-urplus?language=en
/api/events?language=vi&category=main&from=2026-07-01&to=2026-07-31
/api/keepsakes?language=en&tier=UR%2B&page=1&pageSize=12
/api/insignias?language=vi&page=1&pageSize=12
/api/insignias/insignia-Class_SS?language=en
/api/backgears?language=en
/api/tactics?language=vi
```

## Database và nhập dữ liệu

Migration nằm trong `src/OpmWiki.Infrastructure/Persistence/Migrations`. Lệnh `--seed-data` đọc:

- `src/data/characters.json`
- `src/data/characters_en.json`
- `src/data/events.json`
- `src/data/mastery.json`
- `src/data/insignias.json`
- `src/data/backgear.json`
- `src/data/tactics.json`

Seeder là bootstrap insert-only: chỉ thêm aggregate chưa có theo khóa nghiệp vụ. Chạy lại không cập nhật,
không thay thế kỹ năng/hiệu ứng/liên kết và không xóa nội dung hiện có. PostgreSQL dùng transaction advisory
lock để nhiều instance không bootstrap đồng thời.

Không ghi mật khẩu production vào `appsettings.json`. Khi triển khai, cấu hình bằng biến môi trường:

```text
ConnectionStrings__OpmWiki=Host=...;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
AdminAuth__Username=wiki-admin
AdminAuth__Password=<mật khẩu mạnh>
AdminAuth__JwtSigningKey=<chuỗi ngẫu nhiên tối thiểu 32 ký tự>
PublicAppUrl=https://<domain>
Email__ResendApiKey=<Resend API key>
Email__From=OPM Wiki <no-reply@<verified-domain>>
PasswordReset__TokenLifetimeMinutes=15
BankTransfer__BankId=<mã ngân hàng VietQR>
BankTransfer__AccountNumber=<số tài khoản nhận đúng như SePay>
BankTransfer__AccountName=<tên chủ tài khoản>
SePay__WebhookSecret=<bí mật HMAC giống cấu hình trong SePay, tối thiểu 32 ký tự>
```

## Cổng người dùng, nhân viên và quản trị

- `User`: bình luận sự kiện, diễn đàn, tư vấn Wiki/AI và gửi yêu cầu nạp.
- `Staff`: kế thừa quyền cộng đồng và xóa nội dung không hợp lệ; không có quyền xử lý thanh toán.
- `Admin`: dashboard, phân quyền, bật/tắt tài khoản database, CRUD nhân vật/Kỷ vật và CRUD lịch sự kiện.

Đăng ký tài khoản yêu cầu Gmail `@gmail.com`; dấu chấm và phần `+tag` được chuẩn hóa để
một hộp thư không tạo nhiều account. Quên mật khẩu dùng token ngẫu nhiên một lần, database chỉ
lưu SHA-256 của token và mặc định hết hạn sau 15 phút. Email production được gửi qua Resend.

Mật khẩu người dùng được băm PBKDF2-SHA256 với salt ngẫu nhiên. JWT chứa vai trò, nhưng ASP.NET đối chiếu lại `IsActive` và `Role` trong database ở `OnTokenValidated`; account bị khóa hoặc token có role cũ bị từ chối ngay trên mọi endpoint bảo vệ. Admin cấu hình môi trường có subject riêng và không phụ thuộc bản ghi database.
Thanh toán ngân hàng chỉ được cộng số dư từ webhook SePay có chữ ký hợp lệ. Mỗi mã giao dịch SePay là duy nhất,
việc cộng tiền và ghi `balance_ledger` nằm trong cùng giao dịch cơ sở dữ liệu. Hệ thống không lưu OTP, mật khẩu
hay dữ liệu thẻ ngân hàng đầy đủ.

Trợ lý luôn có fallback tra cứu PostgreSQL. Để bật một dịch vụ AI tương thích Chat Completions, cấu hình:

```text
AiAdvisor__Enabled=true
AiAdvisor__Endpoint=https://your-provider.example/v1
AiAdvisor__ApiKey=<secret>
AiAdvisor__Model=<model-name>
```

## Quản trị dữ liệu

Frontend quản trị nằm tại `/admin/login`. Trong development, Docker Compose dùng tài khoản
`admin` / `dev-only-change-me` nếu `.env` chưa ghi đè. Không sử dụng thông tin mặc định này ở
production; hãy cấu hình ba biến `AdminAuth__*` bằng secret của nền tảng triển khai.

Kỷ vật tiếp tục là thuộc tính của Nhân vật thay vì một bảng trùng lặp. Endpoint Kỷ vật cập nhật
`KeepsakeIcon` trên bản ghi Nhân vật tương ứng. Đường dẫn ảnh không được chứa dấu `+`; dùng tên an
toàn như `SSRplus` để cùng hoạt động trên Vite và Vercel.

`--seed-data`, `Database__MigrateOnStartup` và `Database__SeedWhenEmpty` chỉ dành cho môi trường không phải
Production. Ứng dụng sẽ từ chối khởi động ở Production nếu một trong các tùy chọn này được bật; migration
Production phải chạy bằng release job riêng.
