# Triển khai backend production

Backend được đóng gói bằng `Dockerfile` ở thư mục gốc repository để image nhận được cả source .NET và dữ liệu seed trong `src/data`.

## 1. Dịch vụ cần có

- Một nền tảng chạy Docker container và cấp HTTPS công khai.
- PostgreSQL có lưu trữ bền vững.
- Vercel tiếp tục phục vụ frontend Vue.

Health check dùng `GET /api/health`. Kiểm tra cả PostgreSQL bằng `GET /api/health/database`.

### Phương án miễn phí không cần thẻ: Back4app Containers + Neon

Back4app Containers có thể build API trực tiếp từ GitHub repository bằng
Dockerfile. Khi tạo app, chọn repository này, đặt root là thư mục gốc (`/`),
port `8080` và nhập các biến production trong phần **Environment Variables**.

Với `ConnectionStrings__OpmWiki`, chọn **Direct connection** và định dạng
**.NET / Npgsql** trên Neon (`Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=VerifyFull;Channel Binding=Require`).
Không commit connection string, mật khẩu Admin hoặc JWT signing key.

Sau khi deploy thành công, sao chép public Back4app URL rồi đặt URL đó làm
`VITE_API_BASE_URL` trên Vercel.

## 2. Build image

Chạy từ thư mục gốc repository:

```powershell
docker build -t opmwiki-api .
```

Container lắng nghe cổng `8080`, chạy bằng user không phải root và chứa sẵn JSON dùng để seed lần đầu.

## 3. Biến môi trường bắt buộc

```text
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__OpmWiki=Host=<host>;Port=5432;Database=<database>;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
Database__MigrateOnStartup=true
Database__SeedWhenEmpty=true
AdminAuth__Username=<admin username>
AdminAuth__Password=<strong admin password>
AdminAuth__JwtSigningKey=<random secret of at least 32 characters>
Cors__AllowedOrigins__0=https://opmts-wiki.vercel.app
```

Nếu cần kiểm thử từ Vercel Preview, thêm URL Preview chính xác:

```text
Cors__AllowedOrigins__1=https://opm-strongest-wiki-git-codex-community-role-portals-beater3.vercel.app
```

`Database__SeedWhenEmpty=true` chỉ seed khi bảng Nhân vật chưa có dữ liệu. Các lần restart sau không ghi đè nội dung Admin đã chỉnh sửa.

Các biến AI là tùy chọn và nên để tắt cho đến khi có nhà cung cấp:

```text
AiAdvisor__Enabled=false
AiAdvisor__Endpoint=
AiAdvisor__ApiKey=
AiAdvisor__Model=
```

## 4. Cấu hình Vercel

Sau khi backend có URL HTTPS, tạo biến cho cả Preview và Production:

```text
VITE_API_BASE_URL=https://<backend-domain>
```

Vite nhúng biến này tại thời điểm build, vì vậy phải Redeploy frontend sau khi thay đổi.

## 5. Kiểm tra sau triển khai

```powershell
Invoke-RestMethod https://<backend-domain>/api/health
Invoke-RestMethod https://<backend-domain>/api/health/database
Invoke-RestMethod "https://<backend-domain>/api/characters?page=1&pageSize=1&language=vi"
```

Sau đó kiểm tra theo thứ tự: đăng ký User, đăng nhập User, đăng nhập Staff, đăng nhập Admin, tạo bình luận, tạo yêu cầu nạp và duyệt yêu cầu.

## 6. Nguyên tắc an toàn

- Không dùng `dev-only-change-me` hoặc signing key development ở production.
- Không commit connection string, mật khẩu Admin hoặc API key.
- Chỉ khai báo đúng domain frontend trong CORS.
- Sao lưu PostgreSQL trước khi chạy migration mới.
- Giữ `Database__SeedWhenEmpty=true`; không chạy `--seed-data` trên database đang vận hành nếu không chủ động muốn JSON ghi đè dữ liệu tra cứu.
