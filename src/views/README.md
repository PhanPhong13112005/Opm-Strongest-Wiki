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

### 6. `PrivacyView.vue` & `HistoryView.vue`
*   Trang Chính sách bảo mật song ngữ và Lịch sử cập nhật phiên bản được phát triển từ phiên bản v2.0.
