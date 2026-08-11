# Lịch sử phiên bản OPM Strongest Wiki

## 11/08/2026 — Bảng Xếp Hạng Cộng Đồng và xác minh tài khoản

- Thêm trang **Bảng Xếp Hạng Cộng Đồng** cho UR+, UR, SSR+, SSR, SR và R, dùng dữ liệu phiếu nền có thể
  chỉnh sửa trong `BANG_XEP_HANG_NHAN_VAT.json` rồi cộng phiếu thật từ cộng đồng.
- Giữ nhân vật **Cốt Lõi** ở hàng riêng; các nhân vật còn lại tự phân vào SS, S, A, B, C và D theo tổng phiếu,
  vì vậy nhân vật có nhiều phiếu hơn sẽ tự di chuyển lên nhóm cao hơn.
- Hiển thị số người tham gia và tổng lượt bình chọn từ dữ liệu mẫu cộng dữ liệu API; nêu rõ bảng chỉ mang tính
  tham khảo vì sức mạnh còn phụ thuộc tuổi server, đội hình, tài nguyên và meta.
- Thêm bình chọn theo tài khoản và theo phẩm: tài khoản chưa xác minh được chọn 1 nhân vật mỗi phẩm mỗi tháng;
  tài khoản đã xác minh Gmail hoặc số điện thoại được chọn tối đa 8 nhân vật mỗi phẩm mỗi tháng.
- Thêm hộp xác nhận trước khi gửi phiếu; phiếu đã xác nhận là bất biến trong kỳ tháng hiện tại và API từ chối yêu cầu hủy.
- Tách dữ liệu bình chọn bằng khóa tháng theo múi giờ `Asia/Ho_Chi_Minh`. Khi sang tháng, API chỉ đọc kỳ mới nên
  hạn mức tự làm mới lúc 00:00 ngày đầu tháng mà không cần cron xóa lịch sử cũ.
- Thêm luồng gửi email xác minh bằng Resend, liên kết có thời hạn, token lưu dạng băm, dùng một lần và có giới hạn
  tần suất gửi lại. Production yêu cầu domain gửi đã xác minh và cấu hình server đầy đủ.
- Sửa đường dẫn ảnh nhân vật để hoạt động trên production, thêm nút mũi tên cho thanh phẩm và từng hàng nhân vật,
  tối ưu thẻ xếp hạng trên mobile, Việt hóa `CORE` thành `CỐT LÕI` và chuẩn hóa màu nhãn phẩm.
- Đưa thông tin cách tính phiếu và hạn mức tháng lên vùng đầu trang, tăng cỡ chữ cảnh báo và bỏ mô tả nhỏ dưới nhãn Tier.
- Đổi favicon trình duyệt sang biểu tượng Saitama với biến thể 64 px và Apple Touch Icon 180 px.
- Đánh dấu **Trợ lý dữ liệu** là tính năng **Thử nghiệm** tại menu và trong trang; trang Nạp thẻ tiếp tục ở trạng thái
  **Bảo trì**, không nhận đơn hoặc yêu cầu chuyển khoản mới.
- Bổ sung kiểm thử API cho khóa tháng, giới hạn 1/8 lượt, idempotency, nâng hạng theo phiếu, xác minh Gmail,
  asset production và điều hướng responsive. Toàn bộ 99 Node tests và production build đều đạt.

## 10–11/08/2026 — Hoàn thiện Tinh Thông, Tinh Luyện Trung Tâm và trải nghiệm Trang bị

- Hoàn thiện trang **Tinh Luyện Trung Tâm** với hai nhánh Năng Lượng/Mô-đun, công cụ tính EXP và nguyên liệu,
  cơ chế khóa ô chỉ số, bảng phẩm chất theo cấp, mốc mở ô và kho chỉ số song ngữ.
- Viết lại logic **Tinh Thông** theo dữ liệu đã đối chiếu: điều kiện và số ô nhân vật hỗ trợ riêng cho Phe/Hệ/Cấp,
  chi phí từng bậc, chỉ số tăng trưởng, buff nâng cao và quy tắc giữ/xóa lựa chọn khi đổi nhánh.
- Bổ sung mô phỏng **Chuyên Công/Chuyên Thủ** trong Đấu Trường theo BP, bậc Tinh Thông, Backgear và chỉ số đối thủ.
- Hoàn thiện bốn khu vực của **Trang bị**: sơ đồ tiến hóa, mô phỏng bộ bốn món, bộ Vàng cơ bản và bộ Đỏ nâng cao;
  hỗ trợ chọn trọn bộ, phối từng vị trí, bỏ/thay món, nâng cấp, sao vàng, sao tím và tổng hợp nguyên liệu.
- Đồng bộ cách gọi Tinh Thông và Tinh Luyện Trung Tâm là **Tính năng**, không phải nhóm Hệ thống.
- Thêm hoạt ảnh có hướng khi đổi tab/nhánh, phản hồi khi chọn món, nâng sao, kích hoạt set và mở hộp chọn;
  tôn trọng thiết lập `prefers-reduced-motion` và giữ giao diện không tràn ngang trên mobile 390 px.
- Sinh manifest kích thước ảnh sự kiện và khai báo `width`/`height` trước khi ảnh tải để giảm layout shift trên trang chi tiết sự kiện.
- Kiểm tra thành công 92 Node tests, 50 Playwright tests (1 test telemetry được cấu hình bỏ qua), production build
  và `git diff --check`.

## 09/08/2026 — Đồng bộ Vai trò nhân vật từ Markdown và tối ưu Caching Local

- Trích xuất tự động thuộc tính Vai trò (`Roles`) cho toàn bộ 177 nhân vật từ [DANH_SACH_KY_NANG_NHAN_VAT_EN.md](file:///d:/Code/OpmWiki/docs/DANH_SACH_KY_NANG_NHAN_VAT_EN.md).
- Dịch và chuẩn hóa 179 thuật ngữ Vai trò sang Tiếng Việt cho catalog chính (`src/data/characters.json`), đồng thời tự động lọc bớt thẻ `Hạt Nhân` cũ khỏi `dacTinh` cho các nhân vật không phải Core.
- Mở rộng script import `update-character-skills-from-markdown.mjs` và `update-vietnamese-skills-from-english.mjs` để duy trì đồng bộ Vai trò song ngữ khi re-run pipeline.
- Sinh lại toàn bộ 177 cặp file JSON chi tiết tại `public/character-details/vi/` và `public/character-details/en/` cùng `homeCharacterSummaries.json`.
- Cập nhật `characterApi.js` ưu tiên dữ liệu local mới nhất và chuyển `loadLocalCharacterDetail` sang `no-cache` trong môi trường DEV để không bị dính đĩa cache trình duyệt.
- Đã kiểm thử thành công 74/74 test tự động.

## 08/08/2026 — Triển khai Trang bị, Chuẩn hóa Kỹ năng và Ý tưởng Hệ thống Mới

- **Trang Trang bị (Gear):** Triển khai thành công hệ thống Trang bị với 20 bộ trang bị, giả lập nâng cấp/tiến hóa/tinh luyện và tính toán chỉ số chuẩn game.
- **Trang Thẻ Bổ trợ (Buff Gear):** Tiến hành phát triển và triển khai hệ thống Thẻ Bổ trợ độc lập.
- **Chuẩn hóa Kỹ năng Nhân vật:** Hoàn thành chỉnh sửa và làm mới toàn bộ bộ kỹ năng cho 177 nhân vật khớp với dữ liệu thực tế in-game.
- **Lên ý tưởng Tính năng mới (08/08/2026):**
  - Khởi động ý tưởng phát triển các trang **Thiên phú (Talents)** và **Chỉ số (Stats)**.
  - Cập nhật thêm định hướng phát triển tính năng **Ấn ký (Insignias)** và **Trang bị Khuyên dùng (Recommended Gear)** cho từng nhân vật.

## 04/08/2026 — Hoàn tất Việt hóa hiệu ứng và tìm kiếm tên song ngữ

- Áp dụng bảng chốt gồm 318 thuật ngữ/hiệu ứng và 177 tên nhân vật vào catalog tiếng Việt.
- Giữ catalog tiếng Anh làm nguồn đối chiếu ổn định theo ID và bổ sung danh sách tên seed cũ để tương thích API production.
- Không để dữ liệu API cũ ghi đè tên hoặc hiệu ứng vừa Việt hóa; tên tùy chỉnh của Admin vẫn được ưu tiên.
- Tìm kiếm nhân vật bằng tên Việt, tên Anh, tên cũ, ID hoặc tiếng Việt không dấu ở cả giao diện VI và EN.
- Bổ sung kiểm thử tính đầy đủ của bảng Việt hóa, tương thích dữ liệu API cũ và tìm kiếm song ngữ; toàn bộ 46 test đạt và build production thành công.

## 03/08/2026 — Lên ý tưởng Trang bị và Thẻ Bổ trợ

- Khởi động định hướng thiết kế và xây dựng dữ liệu cho tính năng **Trang bị (Gear)** và **Thẻ Bổ trợ (Buff Gear)**.

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
