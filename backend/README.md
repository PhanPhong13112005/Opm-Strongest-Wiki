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

Các endpoint dữ liệu hỗ trợ `language=vi` hoặc `language=en`.

Ví dụ:

```text
/api/characters?language=vi&tier=UR%2B&page=1&pageSize=12
/api/characters/100013-urplus?language=en
/api/events?language=vi&category=main&from=2026-07-01&to=2026-07-31
```

## Database và nhập dữ liệu

Migration nằm trong `src/OpmWiki.Infrastructure/Migrations`. Lệnh `--seed-data` đọc:

- `src/data/characters.json`
- `src/data/characters_en.json`
- `src/data/events.json`
- `src/data/mastery.json`

Quá trình nhập là idempotent: chạy lại sẽ cập nhật theo ID, thay thế kỹ năng/hiệu ứng cũ và xóa bản ghi không còn trong JSON nguồn.

Không ghi mật khẩu production vào `appsettings.json`. Khi triển khai, cấu hình bằng biến môi trường:

```text
ConnectionStrings__OpmWiki=Host=...;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
```
