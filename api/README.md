# Vercel Functions API

Thư mục này thay thế phần API cộng đồng của ASP.NET Core khi chạy production trên
Vercel Hobby. Frontend và API dùng chung domain nên không cần cấu hình CORS hay
`VITE_API_BASE_URL` ở production.

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

## Biến môi trường trên Vercel

Thiết lập cho cả Production và Preview:

```text
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require
ADMINAUTH__USERNAME=admin
ADMINAUTH__PASSWORD=<mật khẩu quản trị mạnh>
ADMINAUTH__JWTSIGNINGKEY=<chuỗi ngẫu nhiên tối thiểu 32 ký tự>
```

Có thể dùng connection string kiểu .NET qua `CONNECTIONSTRINGS__OPMWIKI` thay cho
`DATABASE_URL`. Không cần đặt đồng thời cả hai.

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
