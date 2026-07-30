# Backend production — Giai đoạn 1

## Quyết định backend chính

ASP.NET Core là backend mục tiêu cho quá trình cutover. Backend này chỉ trở thành backend production chính thức sau
khi staging deployment, contract/parity test, migration release job, webhook SePay và routing API đều được kiểm tra
thành công. Quyết định mục tiêu dựa trên độ phủ endpoint, authentication/authorization, EF Core migrations, health
checks và khả năng đóng gói Docker; không dựa trên backend đang được deploy. Vercel Functions tiếp tục phục vụ traffic
hiện tại cho đến khi hoàn tất các cổng chuyển đổi bên dưới.

Frontend đang dùng các nhóm API auth, tài khoản, dashboard, nhân vật, kỷ vật, sự kiện, lịch phát hành,
community/forum/moderation, top-up và advisor. ASP.NET Core bao phủ các nhóm này và còn có API Mastery, Insignias,
Backgears và Tactics. Vercel Functions chưa có bốn API dữ liệu này; frontend phải dùng dữ liệu tĩnh khi chạy với backend đó.

Nghiệp vụ bị trùng giữa hai backend gồm auth, role/trạng thái tài khoản, comment/forum/moderation, top-up/payment,
SePay, dashboard/users, character, event và release schedule. Hai implementation phải được coi là hai nguồn có thể lệch
validation, schema và hành vi cho đến khi hoàn tất contract test và cutover.

Điều kiện trước khi chuyển traffic:

- Deploy ASP.NET Core và định tuyến `/api/*` hoặc cấu hình `VITE_API_BASE_URL` theo môi trường.
- Chuyển webhook SePay sang endpoint ASP.NET Core và kiểm thử chữ ký, replay, idempotency.
- Chạy migration bằng release job với role migrator riêng.
- Có HTTP/contract integration test trên PostgreSQL thật cho auth, CORS, webhook, top-up và endpoint frontend dùng.
- Bổ sung rate limit cho endpoint nhạy cảm, logging có cấu trúc và hệ thống theo dõi lỗi.
- Chạy parity smoke test và thời gian theo dõi ổn định trên staging.

## Seeder và startup ASP.NET Core

Luồng startup là `Program.cs` đọc `--seed-data`, `Database:MigrateOnStartup` và `Database:SeedWhenEmpty`, tạo scope,
chạy `MigrateAsync` rồi gọi `IDataSeeder.SeedAsync`. Npgsql bật retry bằng EF Core execution strategy.

Transaction do ứng dụng tạo nằm bên trong `CreateExecutionStrategy().ExecuteAsync`, vì vậy toàn bộ transaction là một
đơn vị có thể retry. Lỗi cũ xảy ra khi transaction do ứng dụng tạo nằm ngoài execution strategy; cấu trúc đó không được
đưa trở lại.

Seeder hiện có các bất biến sau:

- Bootstrap insert-only theo khóa nghiệp vụ; chỉ bổ sung và map đầy đủ aggregate gốc chưa tồn tại.
- Không cập nhật hoặc xóa entity có sẵn, kỹ năng, hiệu ứng hay liên kết guide.
- Không bổ sung child còn thiếu nếu aggregate gốc đã tồn tại; đây không phải cơ chế đồng bộ đầy đủ database thiếu một phần.
- Hành vi insert-only bảo vệ dữ liệu Admin chỉnh sửa và bản ghi Admin tự tạo khỏi bị ghi đè hoặc xóa.
- PostgreSQL lấy transaction advisory lock trước khi truy vấn dữ liệu hiện có để serialize nhiều instance.
- `SeedWhenEmpty` gọi bootstrap insert-only mỗi lần cờ được bật để bổ sung aggregate gốc còn thiếu.
- Production fail-fast nếu bật startup migration, startup seed hoặc `--seed-data`.

Production không chạy dữ liệu mẫu. Nếu cần nhập dữ liệu nghiệp vụ vào Production trong tương lai, phải có job riêng,
review dataset, dry-run, backup và rollback plan được phê duyệt.

## DDL runtime của Vercel

`api/_lib/database.js` chạy `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` và
`CREATE INDEX IF NOT EXISTS` cho account, community, top-up, payment và ledger khi function xử lý request đầu tiên.
`api/_lib/adminDatabase.js` làm tương tự cho character, skill/effect, event và release schedule, đồng thời seed dữ liệu
khi tổng số dòng của từng bảng bằng không.

Rủi ro đã xác nhận:

- Promise cache chỉ có phạm vi một warm instance; nhiều cold start vẫn có thể chạy DDL đồng thời.
- `IF NOT EXISTS` giúp chạy lặp lại nhưng không cung cấp version, checksum hoặc lịch sử migration.
- `ALTER TABLE` lấy lock mạnh; `CREATE INDEX` không concurrent có thể chặn truy vấn.
- App runtime phải giữ quyền DDL, lớn hơn quyền cần thiết để phục vụ request.
- Seed theo tổng số dòng bằng không bỏ qua bản ghi nguồn mới khi bảng đã có bất kỳ dữ liệu nào.
- Dashboard có thể truy vấn các bảng admin trước khi đường khởi tạo admin schema đã chạy trên database mới.
- Hai schema promise riêng không tạo khóa hoặc thứ tự toàn cục.

Không thay đổi runtime DDL trong Giai đoạn 1. Việc baseline hoặc chuyển schema production chỉ được thực hiện sau schema
diff, backup, staging rehearsal và kiểm thử rollback.

## Thiết kế migration có phiên bản cho Vercel

- Thư mục: `api/migrations/`.
- Tên file: `YYYYMMDDHHMMSS_<slug>.up.sql`; chỉ thêm `.down.sql` khi đường lùi đã được kiểm thử.
- Lịch sử: `app_schema_migrations` chứa version khóa chính, tên, checksum, thời điểm áp dụng và thời gian thực thi.
- Runner dự kiến: `scripts/migrate-vercel.mjs`, gọi qua `npm run db:migrate`, không được import từ request handler.
- Runner mở một PostgreSQL session, lấy advisory lock toàn cục và chạy mỗi migration trong transaction riêng.
- Runner từ chối chạy nếu checksum của migration đã áp dụng không còn khớp; không sửa migration đã áp dụng.
- Role `app` chỉ có DML và quyền dùng sequence; role `migrator` sở hữu schema và có DDL.

Quy trình môi trường:

- Development: database local riêng; chạy migration từ schema rỗng và chạy lại để xác nhận idempotency.
- Automated test: PostgreSQL/branch tạm thời riêng cho từng run; PGlite và EF InMemory chỉ phục vụ unit test nhanh.
- Staging: database và credential riêng; backup trước migration, chạy release job, health/contract smoke test và soak.
- Production: database protected riêng; snapshot/PITR hoặc backup trước migration, một release job duy nhất, migration
  hoàn tất trước khi chuyển phiên bản ứng dụng.

Rollback ưu tiên quay lại phiên bản ứng dụng. Chỉ chạy Down khi đã rehearsal; thay đổi không đảo ngược dùng restore/PITR
hoặc forward-fix migration mới. Baseline database đang tồn tại chỉ được ghi vào lịch sử sau khi schema diff và checksum
được xác nhận trên staging.

## Cấu hình môi trường tối thiểu

Chỉ tên biến được ghi nhận, không lưu giá trị trong tài liệu hoặc source:

- Database Node/Vercel: `DATABASE_URL`, `NEON_DATABASE_URL`, `CONNECTIONSTRINGS__OPMWIKI`.
- Database ASP.NET Core: `ConnectionStrings__OpmWiki`.
- Startup database: `Database__MigrateOnStartup`, `Database__SeedWhenEmpty`.
- Frontend routing: `VITE_API_BASE_URL`.
- Các nhóm secret runtime khác được nạp từ cấu hình nền tảng, không từ file được commit.

Mỗi Development, Automated test, Staging và Production phải có database và credential riêng. Staging/Production phải
có role app và migrator khác nhau; không tái sử dụng credential giữa môi trường. Repo chưa chứng minh được cấu hình remote
đã tách đúng, vì vậy đây là cổng triển khai bắt buộc chứ không phải trạng thái đã hoàn tất.

## Vận hành, backup và theo dõi

- Release ghi version ứng dụng và migration đã áp dụng nhưng không ghi connection string hay secret.
- Theo dõi lỗi migration, startup, health database, latency và tỷ lệ lỗi endpoint sau deploy.
- Backup phải được kiểm tra khả năng restore định kỳ; việc có backup nhưng chưa thử restore không được coi là rollback plan.
- Giữ Vercel Functions làm đường phục vụ hiện tại cho đến khi ASP.NET Core đạt toàn bộ cổng cutover.
- Sau cutover, khóa phát triển nghiệp vụ mới trên Vercel Functions và lên kế hoạch loại runtime DDL theo từng migration.
