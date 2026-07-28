# Lịch sử phiên bản OPM Strongest Wiki

Tài liệu này ghi lại các mốc đã được đối chiếu với lịch sử Git và trạng thái mã nguồn. Dự án hiện
chưa phát hành theo Semantic Versioning và `package.json` vẫn dùng phiên bản `0.0.0`.

## 28/07/2026 — Hàng đợi Admin và audit đơn Coupon

- Thêm route `/admin/top-ups`, service và giao diện mobile để Admin lọc, kiểm tra UID/SID, duyệt hoặc từ chối đơn Coupon.
- Chuẩn hóa API thành `/api/admin/top-ups`; giữ `/api/staff/top-ups` làm alias tương thích ngược nhưng Staff vẫn không có quyền xử lý thanh toán.
- Đồng bộ Vercel Functions và ASP.NET Core, thêm `ReviewedBySubject` để audit cả Admin cấu hình môi trường lẫn Admin database.
- Bổ sung migration EF Core, test ma trận quyền, repository .NET và Playwright cho luồng duyệt coupon.
- Lịch sử Coupon phía User hiển thị UID/SID, số Coupon, trạng thái, thời gian xử lý và phản hồi Admin.
- UI và cả hai backend bắt buộc lý do khi Admin từ chối đơn.
- User có thể hủy đơn Coupon của chính mình khi còn chờ; API kiểm tra ownership, idempotency và race với thao tác Admin.
- Admin có thể lọc và nhận biết đơn `Cancelled` mà không thể duyệt lại.
- Chặn Admin database tự duyệt/từ chối đơn Coupon của chính account; portal yêu cầu Admin khác xử lý và backend enforce trong optimistic update.
- Kiểm tra lại UID/SID, QTY và giá trị trước khi duyệt; đơn Coupon legacy/malformed được cảnh báo, khóa thao tác duyệt nhưng vẫn cho từ chối để dọn hàng đợi.
- Đồng bộ phản hồi review Coupon giữa Vercel và ASP.NET: phân biệt rõ đơn sai dữ liệu, self-review và đơn không còn chờ xử lý; vẫn giữ optimistic update để chống xử lý đua.
- Hộp xác nhận review hiển thị người nhận, UID, server, số Coupon và giá trị; nếu Admin khác xử lý trước, portal tự tải lại hàng đợi sau phản hồi `409` để loại trạng thái stale.
- Hoàn thiện quản lý trạng thái tài khoản: Admin bật/tắt `IsActive`, không thể tự đổi role/tự khóa; Vercel và ASP.NET đều tái xác minh active/role để vô hiệu hóa token cũ ngay trên request bảo vệ, frontend xóa session khi nhận `401`.
- Chuẩn hóa thứ tự authorization Vercel: account thiếu/inactive hoặc token mang role cũ trả `401`; identity hợp lệ nhưng thiếu quyền endpoint mới trả `403`.
- Khóa contract cập nhật trạng thái ASP.NET: `isActive` bắt buộc là boolean `true`/`false`; thiếu, `null` hoặc sai kiểu trả `400`.
- Chống tạo trùng đơn khi client retry sau timeout: frontend giữ nguyên reference sinh bằng `crypto.randomUUID`, cả Vercel và ASP.NET trả lại cùng bản ghi cho cùng `(UserId, ReferenceCode)`/payload; không phát sinh migration.

## 23/07/2026 — Điều hướng tài khoản theo vai trò

- Sau khi đăng nhập hoặc đăng ký, mọi vai trò đều trở về Trang chủ.
- Thêm menu tài khoản trên avatar/tên vai trò, có màu nhận diện riêng và thao tác đăng xuất rõ ràng.
- User mở Diễn đàn; Staff mở trang Nhân viên; Admin mở trang Quản trị từ menu tài khoản.
- Sửa trạng thái header không cập nhật ngay sau đăng nhập và bổ sung kiểm thử trình duyệt cho cả ba vai trò.
- Thêm trang Nạp Coupon cho User với UID, Server, gói 6 Coupon, số lượng, tổng tiền và lịch sử xử lý;
  yêu cầu Coupon không cộng nhầm giá trị đơn hàng vào số dư khi Staff duyệt.

## 22/07/2026 — Neon, API production và kiểm thử tích hợp

- Chuyển API cộng đồng, xác thực và CRUD Admin sang Vercel Functions.
- Dùng Neon PostgreSQL cho tài khoản, bình luận, diễn đàn, yêu cầu nạp, Nhân vật, Sự kiện và Lịch ra mắt.
- Thêm public API song ngữ cho danh sách/chi tiết Nhân vật và Sự kiện.
- Đọc Lịch ra mắt CN/SEA trực tiếp từ PostgreSQL.
- Thêm JSON fallback khi API lỗi, cache client/CDN và invalidation sau CRUD Admin.
- Lưu và đọc kỹ năng/hiệu ứng nhân vật từ PostgreSQL.
- Thêm production Admin CRUD smoke test và Playwright integration test cho luồng
  `Admin API → Vue public character detail`.
- Thiết kế lại cổng User, Staff và Admin theo cùng hệ thống giao diện, có màu nhận diện riêng,
  tác vụ rõ ràng và điều hướng responsive theo vai trò.
- Thêm kiểm thử tích hợp giao diện cho ba dashboard, bao gồm Staff trên màn hình mobile.

## 19–20/07/2026 — Tài khoản và portal theo vai trò

- Thêm đăng ký/đăng nhập, JWT và ba vai trò User, Staff, Admin.
- Thêm bình luận sự kiện, diễn đàn, trợ lý dữ liệu và yêu cầu nạp.
- Thêm khu vực Staff để kiểm duyệt nội dung và duyệt yêu cầu nạp.
- Thêm Dashboard Admin và quản lý Nhân vật, Kỷ vật, Sự kiện, Lịch ra mắt.

## 17–18/07/2026 — Backend ASP.NET Core và PostgreSQL

- Xây dựng backend .NET, EF Core migrations và PostgreSQL seed từ dữ liệu wiki.
- Chuyển Mastery, Keepsake, Insignia, Backgear và Tactics sang mô hình API-first.
- Sắp xếp nhân vật theo ngày ra mắt mặc định.
- Hoàn thiện 10 Huy hiệu hợp lệ, nguồn nhận và zoom hướng dẫn.
- Bổ sung chỉ số đầy đủ theo sao cho Thẻ Chiến thuật và sửa tài nguyên SSR+ trên Vercel.
- Tích hợp Vercel Analytics và Speed Insights.

## 15–16/07/2026 — Hệ thống nội dung mở rộng

- Thêm trang Chiến thuật, Huy chương, Kỷ vật và Huy hiệu.
- Thêm phân trang, bộ lọc, modal/zoom và hoàn thiện responsive.
- Cấu hình Vercel SPA routing, chuẩn hóa đường dẫn `URplus`, lazy loading và preload ảnh.
- Hoàn thiện i18n cho Trang chủ, Mastery và dữ liệu CN/SEA.

## 13–14/07/2026 — Core Skill, Sự kiện và tài liệu

- Thêm Core Skill/Core Lab, tính tài nguyên và liên kết từ chi tiết nhân vật.
- Mở rộng lịch sự kiện, chi tiết nhiệm vụ/phần thưởng và trải nghiệm mobile.
- Thêm trang Chính sách bảo mật, Lịch sử phiên bản và hệ thống README theo thư mục.

## 11/07/2026 — Khởi tạo dự án

- Khởi tạo Vue 3, Vite, Tailwind CSS, Vue Router và Vue I18n.
- Thêm thư viện nhân vật, trang chi tiết, kỹ năng, hiệu ứng và giao diện tối responsive.
- Xây dựng dữ liệu song ngữ Việt/Anh và các quy tắc phe, hệ, cấp bậc, chỉ số.
