# Thư mục Components (`/src/components`)

Thư mục này chứa các thành phần giao diện nhỏ có tính chất tái sử dụng cao trên toàn hệ thống.

## Các Component Hiện Có
*   **`CharacterCard.vue`**: Thẻ hiển thị nhân vật ở trang chủ.
    *   **Logic xử lý**:
        *   Ánh xạ ảnh chân dung (Avatar) và ảnh nền độ hiếm tương ứng (N, R, SR, SSR, SSR+, UR, UR+).
        *   Hiển thị huy hiệu phân cấp (Badges): Phe Anh Hùng/Tội Phạm dùng cấp bậc (S, A, B...), phe Quái Nhân dùng Mức độ thảm họa (Dragon, Demon, Tiger...).
        *   Đổ bóng màu đặc trưng của Hệ nhân vật (Chiến Đấu, Vũ Khí, Hiệp Sĩ, Tâm Linh) để tạo chiều sâu giao diện.
        *   Hỗ trợ chuyển đổi nhanh hiển thị thông tin theo ngôn ngữ đang chọn.
*   **`SpineFigure.vue`**: Render nhân vật chibi Spine 3.8 lên canvas bằng PixiJS.
    *   Tự tải skeleton, atlas và texture theo nhân vật được chọn.
    *   Chỉ phát animation đứng chờ (`daiji`/`idle`), kiểm tra độ trượt chân trước khi phát, căn nhân vật xuống đáy và giải phóng renderer khi chuyển nhân vật.
    *   Rig không có idle hợp lệ sẽ giữ setup pose, không tự thay bằng animation tấn công hoặc kỹ năng.
*   **`RolePortalShell.vue`**: Khung tiêu đề và thông tin phiên dùng chung cho ba cổng User, Staff và Admin.
    *   Đổi màu nhận diện theo vai trò, hiển thị rõ tên tài khoản và nút đăng xuất.
    *   Dùng chung hệ thống responsive để các dashboard không bị tràn ngang trên mobile.
