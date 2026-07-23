# Lịch sử phiên bản OPM Strongest Wiki

Tài liệu này ghi lại các mốc đã được đối chiếu với lịch sử Git và trạng thái mã nguồn. Dự án hiện
chưa phát hành theo Semantic Versioning và `package.json` vẫn dùng phiên bản `0.0.0`.

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
