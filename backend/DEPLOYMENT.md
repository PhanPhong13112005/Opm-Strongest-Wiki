# Triển khai backend production

> Trạng thái: **KHÔNG ĐƯỢC DEPLOY** cho đến khi toàn bộ production cutover gate trong [`../docs/DEPLOYMENT_RUNBOOK.md`](../docs/DEPLOYMENT_RUNBOOK.md) đạt. Tài liệu này mô tả target ASP.NET cuối cùng; không phải lệnh triển khai đã được phê duyệt.

ASP.NET Core là authoritative production backend của OpmWiki. Frontend Vue/Vite tiếp tục được host trên Vercel; PostgreSQL là database; EF Core là schema/migration owner duy nhất. Node/Vercel Functions là **LEGACY / TRANSITIONAL / ROLLBACK ONLY** trong thời gian cutover và không phải backend authority cuối cùng.

## 1. Topology mục tiêu

```text
Vercel Vue/Vite
  -> VITE_API_BASE_URL
  -> ASP.NET Core HTTPS origin
  -> PostgreSQL
```

Backend được đóng gói bằng `Dockerfile` ở thư mục gốc repository. Health check API là `GET /api/health`; kiểm tra kết nối PostgreSQL là `GET /api/health/database`.

## 2. Build image

Chạy từ thư mục gốc repository:

```powershell
docker build -t opmwiki-api .
```

Container lắng nghe port do nền tảng cấu hình/forward. Việc build image không được chạy migration hoặc seed production.

## 3. Runtime configuration

Chỉ cấu hình tên biến trong secret/config store của nền tảng; không ghi giá trị vào Git hoặc tài liệu.

```text
ASPNETCORE_ENVIRONMENT
ASPNETCORE_URLS (hoặc PORT của nền tảng)
ConnectionStrings__OpmWiki
Database__MigrateOnStartup=false
Database__SeedWhenEmpty=false
AdminAuth__Username
AdminAuth__Password
AdminAuth__JwtSigningKey
PublicAppUrl
Cors__AllowedOrigins__0
```

Các nhóm chỉ cấu hình khi feature tương ứng được bật:

```text
Email__ResendApiKey
Email__From
PasswordReset__TokenLifetimeMinutes
BankTransfer__BankId
BankTransfer__AccountNumber
BankTransfer__AccountName
SePay__WebhookSecret
AiAdvisor__Enabled
AiAdvisor__Endpoint
AiAdvisor__ApiKey
AiAdvisor__Model
```

`PublicAppUrl` là key runtime trực tiếp mà `Program.cs` đọc. `backend/docker-compose.yml` chỉ dành cho local Development: nó nhận wrapper phía host `PUBLIC_APP_URL` rồi map vào container thành `PublicAppUrl`. Không dùng tên wrapper làm key của direct ASP.NET deployment.

Kiểm tra tên biến mà không in giá trị:

```powershell
npm run validate:config -- --target=dotnet
```

## 4. Migration và seed production

Production bắt buộc:

```text
Database__MigrateOnStartup=false
Database__SeedWhenEmpty=false
```

`Program.cs` chủ động từ chối khởi động Production nếu startup migration, startup seed hoặc `--seed-data` được bật. Giữ behavior fail-closed này.

Migration production chỉ chạy một lần từ **CI/CD release migration job** dùng credential `MIGRATOR` riêng, sau khi migration SQL được review, target database được inventory, backup/PITR được xác nhận và rehearsal trên staging hoàn tất. API runtime dùng credential `APPLICATION` chỉ có DML và không được sửa `__EFMigrationsHistory`.

Không chạy `--seed-data` trên production hoặc historical database. Không dùng seed để chữa lỗi cutover.

## 5. Cấu hình Vercel frontend

Frontend production phải build với:

```text
VITE_API_BASE_URL
```

Giá trị runtime do platform quản lý phải trỏ tới ASP.NET HTTPS origin. Mọi dynamic frontend service dùng origin duy nhất này. Same-origin Vercel `/api` Node rewrite chỉ là đường transitional trước cutover, không phải thiết kế permanent split.

## 6. Database roles

- `MIGRATOR`: DDL/schema migration và write `__EFMigrationsHistory` cho release job.
- `APPLICATION`: `SELECT`/`INSERT`/`UPDATE`/`DELETE`, không DDL và không write migration history.
- `READ_ONLY_AUDIT`: `SELECT`/catalog inventory only.

Task Phase 1 không tạo hoặc cấp quyền cho role thật.

## 7. Verification và cutover

Trước staging/production phải hoàn thành toàn bộ gate trong [`../docs/DEPLOYMENT_RUNBOOK.md`](../docs/DEPLOYMENT_RUNBOOK.md), gồm Tier Ranking, email verification, Admin Tier/Community, migration review/rehearsal, backup/PITR, role separation, config, CORS, email, payment sandbox, single webhook, rollback và xác nhận không có dual writer.

Các smoke check read-only sau deploy được phép trong một release đã phê duyệt:

```text
GET /api/health
GET /api/health/database
GET /api/characters?page=1&pageSize=1&language=vi
```

Không dùng production smoke để tự động đăng ký account, tạo comment/top-up, gọi webhook hoặc mutate Admin data nếu chưa có phê duyệt dữ liệu riêng.

## 8. Nguyên tắc an toàn

- Không commit connection string, password, signing material, provider key hoặc webhook secret.
- Không dùng development defaults ở production.
- Chỉ allow đúng frontend origins trong CORS.
- Chỉ một ASP.NET SePay webhook và một ASP.NET payment/ledger writer sau cutover.
- Node writer phải bị disable trước khi ASP.NET writer được enable.
- Không migrate/seed trên API startup; không blind-restore hoặc ghi đè dữ liệu lịch sử.
