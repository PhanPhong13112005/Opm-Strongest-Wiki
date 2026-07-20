# Thư mục Giao Diện Trang (`/src/views`)

Thư mục này chứa tất cả các thành phần View (Trang) hoàn chỉnh hiển thị trên website.

## Chi tiết các trang & Logic xử lý chính

### 1. `HomeView.vue` (Trang Chủ)
*   Hiển thị danh sách thẻ bài nhân vật với bộ lọc đa chiều (Phe phái, Hệ, Độ hiếm).
*   Chứa tính năng tìm kiếm tên tướng thời gian thực (Real-time search) và sắp xếp tướng theo Chỉ số (ATK, HP, DEF, SPD).

### 2. `DetailView.vue` (Chi tiết kỹ năng nhân vật)
*   **Hiển thị Chỉ số**: Chuyển đổi linh hoạt giữa chỉ số gốc (Base) và chỉ số nâng cấp tối đa (PVP).
*   **Hoạt ảnh**: Khung phát Video/GIF mô tả chi tiết hoạt ảnh chiêu thức.
*   **Tab kỹ năng**: Chia thành Cơ bản, Tuyệt kĩ, Nội tại, Thức tỉnh.
*   **Tab Cốt lõi (Core Tab)**:
    *   Tự động hiển thị khi nhân vật có Core.
    *   Sử dụng hàm lọc `coreLevels` để chỉ hiển thị mốc Level 1 (Cơ bản) và Level 4 (Eccentric Power · II), ẩn bớt các mốc level cao để tránh rối mắt.
    *   Cung cấp liên kết nhanh (nút "Xem chi tiết Phòng Nghiên Cứu") nhảy trực tiếp sang trang Core Lab và tự động mở đúng nhân vật đang xem.

### 3. `CoreLabView.vue` (Phòng Nghiên Cứu Core)
*   Hiển thị toàn bộ lộ trình nâng cấp Core skill từ Lv 1 đến Lv 17.
*   Hiển thị thông số chỉ số phụ trợ của phòng thí nghiệm và tính toán tài nguyên nâng cấp tích lũy.

### 4. `EventsView.vue` & `EventDetailView.vue` (Sự kiện tháng)
*   Xem lịch trình banner tướng, sự kiện điểm danh nạp, huấn luyện đặc biệt.
*   Tối ưu hóa vuốt màn hình di động (Snap Scroll) và có nút mũi tên điều hướng hai bên.

### 5. `EquipmentView.vue` & `MasteryView.vue`
*   Quản lý thông tin Kỷ vật (Keepsakes), Huy hiệu (Insignias) và các thuộc tính tinh thông tương ứng trong game.
*   Ảnh hướng dẫn cách lấy Huy hiệu mở trong hộp phóng to ngay trên trang, không điều hướng người dùng sang tệp ảnh.

### 6. `BackgearView.vue`
*   Tra cứu 9 Thẻ Hình nền, xem ảnh theo cấp, chỉ số, chi phí nâng, nguồn nhận và hiệu ứng Bộ Sưu Tập.

### 7. `TacticsView.vue`
*   Hiển thị 19 Thẻ Chiến Thuật, chỉ số tối đa theo phẩm chất và bảng chỉ số đầy đủ theo từng sao.
*   Chi tiết thẻ cho chọn từng cấp sao và hiển thị chỉ số khi lắp tương ứng: ATK cùng S.ATK, C.ATK, R.ATK hoặc G.ATK theo vị trí I–IV.
*   Tra cứu Viền Thẻ, Phòng Nghiên Cứu và phần thưởng Tháp Trăng Khuyết.

### 8. `PrivacyView.vue` & `HistoryView.vue`
*   Trang Chính sách bảo mật song ngữ và Lịch sử cập nhật phiên bản được phát triển từ phiên bản v2.0.

### 9. `AdminLoginView.vue` & `AdminCharactersView.vue`
*   Đăng nhập quản trị bằng JWT, token chỉ tồn tại trong tab hiện tại (`sessionStorage`).
*   Tìm kiếm, phân trang, thêm/sửa/xóa metadata và chỉ số Nhân vật trong PostgreSQL.
*   Gắn, đổi hoặc gỡ Kỷ vật ngay trên bản ghi Nhân vật, không tạo nguồn dữ liệu trùng lặp.

### 10. Cổng cộng đồng theo vai trò
*   `UserPortalView.vue`: trang cá nhân và lối vào Diễn đàn, AI, Nạp thẻ, Bình luận sự kiện.
*   `ForumView.vue`, `AdvisorView.vue`, `TopUpView.vue`: các luồng cộng đồng dành cho tài khoản đã đăng nhập.
*   `StaffDashboardView.vue`: duyệt nạp, xem/xóa bình luận; Staff cũng có thể xóa cả chủ đề hoặc phản hồi vi phạm trong diễn đàn.
*   `AdminDashboardView.vue`: thống kê người dùng/nội dung/dữ liệu, phân vai trò và điều hướng quản trị.
*   `AdminEventsView.vue`: thêm, sửa, xóa nội dung sự kiện trong PostgreSQL.
*   `AdminReleasesView.vue`: thêm, sửa, xóa lịch ra mắt tướng CN/SEA; dữ liệu điều khiển banner trang chủ.
