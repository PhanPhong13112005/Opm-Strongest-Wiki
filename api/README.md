# Vercel Functions API

Thư mục này thay thế phần API cộng đồng của ASP.NET Core khi chạy production trên
Vercel Hobby. Frontend và API dùng chung domain nên không cần cấu hình CORS hay
`VITE_API_BASE_URL` ở production.

## Endpoint đã chuyển

- `/api/health`, `/api/health/database`
- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `/api/events/:eventId/comments`
- `/api/forum/topics`, `/api/forum/topics/:id`, `/api/forum/topics/:id/posts`
- `/api/top-ups`, `/api/top-ups/mine`
- `/api/staff/top-ups`, `/api/staff/top-ups/:id/review`
- `/api/moderation/comments`, `/api/moderation/forum/*`
- `/api/admin/dashboard`, `/api/admin/users`, `/api/admin/users/:id/role`
- `/api/advisor/ask` (tra cứu dữ liệu Wiki nội bộ)

Các màn hình dữ liệu công khai như Nhân vật, Sự kiện, Tinh thông, Kỷ vật, Huy hiệu,
Thẻ Hình nền và Chiến thuật vẫn dùng JSON tĩnh hiện có. Đây là chủ đích để website
không tạo truy vấn PostgreSQL cho nội dung chỉ đọc.

## Biến môi trường trên Vercel

Thiết lập cho cả Production và Preview:

```text
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require
ADMINAUTH__USERNAME=admin
ADMINAUTH__PASSWORD=<mật khẩu quản trị mạnh>
ADMINAUTH__JWTSIGNINGKEY=<chuỗi ngẫu nhiên tối thiểu 32 ký tự>
```

Không thêm tiền tố `VITE_` cho các secret trên. Vercel Function sẽ tự tạo các bảng
cộng đồng còn thiếu trong Neon ở yêu cầu đầu tiên. Schema dùng cùng tên bảng/cột và
định dạng PBKDF2/JWT tương thích với backend .NET hiện có.

## Kiểm tra sau khi deploy

```text
GET  https://<domain>/api/health
GET  https://<domain>/api/health/database
POST https://<domain>/api/auth/register
POST https://<domain>/api/auth/login
```

Không commit connection string, mật khẩu hoặc JWT signing key vào Git.
