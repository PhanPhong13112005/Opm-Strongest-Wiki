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
| `GET/POST` | `/api/top-ups/mine`, `/api/top-ups` | Theo dõi hoặc gửi yêu cầu nạp |
| `GET/PUT` | `/api/staff/top-ups` | Nhân viên duyệt/từ chối yêu cầu nạp |
| `GET/DELETE` | `/api/moderation/comments` | Nhân viên kiểm duyệt bình luận |
| `DELETE` | `/api/moderation/forum/topics/{id}`, `/api/moderation/forum/posts/{id}` | Nhân viên xóa chủ đề hoặc phản hồi vi phạm |
| `GET` | `/api/admin/dashboard` | Thống kê toàn hệ thống |
| `GET/PUT` | `/api/admin/users` | Danh sách và phân vai trò User/Staff/Admin |
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

Migration nằm trong `src/OpmWiki.Infrastructure/Migrations`. Lệnh `--seed-data` đọc:

- `src/data/characters.json`
- `src/data/characters_en.json`
- `src/data/events.json`
- `src/data/mastery.json`
- `src/data/insignias.json`
- `src/data/backgear.json`
- `src/data/tactics.json`

Quá trình nhập là idempotent: chạy lại sẽ cập nhật theo ID, thay thế kỹ năng/hiệu ứng cũ và xóa bản ghi không còn trong JSON nguồn.

Không ghi mật khẩu production vào `appsettings.json`. Khi triển khai, cấu hình bằng biến môi trường:

```text
ConnectionStrings__OpmWiki=Host=...;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
AdminAuth__Username=wiki-admin
AdminAuth__Password=<mật khẩu mạnh>
AdminAuth__JwtSigningKey=<chuỗi ngẫu nhiên tối thiểu 32 ký tự>
```

## Cổng người dùng, nhân viên và quản trị

- `User`: bình luận sự kiện, diễn đàn, tư vấn Wiki/AI và gửi yêu cầu nạp.
- `Staff`: kế thừa quyền cộng đồng, duyệt nạp và xóa nội dung không hợp lệ.
- `Admin`: dashboard, phân quyền, CRUD nhân vật/Kỷ vật và CRUD lịch sự kiện.

Mật khẩu người dùng được băm PBKDF2-SHA256 với salt ngẫu nhiên; JWT chứa vai trò và mọi endpoint ghi đều kiểm tra quyền ở backend.
Yêu cầu nạp chỉ lưu phương thức, mã tham chiếu và số tiền. Không lưu OTP, mật khẩu hay dữ liệu thẻ ngân hàng đầy đủ.

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

Lưu ý: chạy lại `--seed-data` sẽ đồng bộ dữ liệu từ JSON và có thể ghi đè nội dung đã sửa trong
trang quản trị. Chỉ dùng seed khi chủ động muốn JSON trở thành nguồn chuẩn trở lại.
