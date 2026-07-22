# Thư mục Dữ Liệu Tĩnh (`/src/data`)

Thư mục này chứa toàn bộ dữ liệu cấu trúc dưới dạng JSON, hoạt động như cơ sở dữ liệu chính cho ứng dụng.

## Chi tiết các tệp JSON
1.  **`characters.json` (Tiếng Việt) & `characters_en.json` (Tiếng Anh)**:
    *   **Nhiệm vụ**: Chứa toàn bộ thông tin chỉ số, phe phái, hệ, ngày ra mắt, kỷ vật và chi tiết các kỹ năng của tất cả nhân vật trong game từ bậc N đến UR+.
    *   **Cấu trúc chính**:
        *   `id`: Mã định danh duy nhất (VD: `"108"` cho Bomb).
        *   `name`: Tên nhân vật.
        *   `tier`: Bậc nhân vật (`SSR+`, `UR`, `UR+`...).
        *   `faction`: Phe (`Hero`, `Monster`, `Outlaw`).
        *   `type`: Hệ (`Grappler`, `Hi-Tech`, `Duelist`, `Esper`).
        *   `stats`: Các chỉ số cơ bản (HP, ATK, DEF, SPD).
        *   `skills`: Mảng chứa thông tin kỹ năng gồm:
            *   `name`: Tên kỹ năng.
            *   `type`: Loại kỹ năng (`basic`, `ult`, `passive`, `awaken`).
            *   `desc`: Mô tả chi tiết kỹ năng (hỗ trợ định dạng HTML/CSS để bôi màu chữ).
            *   `videoURL` / `animationURL`: Hoạt ảnh kỹ năng dạng video hoặc gif.
2.  **`coreLab.json`**:
    *   **Nhiệm vụ**: Chứa dữ liệu logic cho phân hệ Phòng Thí Nghiệm Cốt Lõi (Core Lab).
    *   **Cấu trúc chính**:
        *   `heroes`: Mảng các tướng có Core Skill. Mỗi tướng chứa:
            *   `coreHeId`: ID liên kết đến Core Lab.
            *   `coreName`: Tên kỹ năng Core.
            *   `levels`: Danh sách mốc nâng cấp từ lv 1 đến lv 17, bao gồm chi tiết tài nguyên tiêu hao (`cost`), hiệu quả sơ cấp (`coreEffect`), hiệu quả cao cấp (`reward`), điều kiện kích hoạt (`condition`), và biểu tượng mốc nâng cấp (`milestoneIcon`).
3.  **`events.json`**:
    *   **Nhiệm vụ**: Quản lý lịch trình sự kiện trong tháng (Banner chiêu mộ, Sự kiện huấn luyện, Quà nạp mốc).
4.  **`releaseSchedule.json`**:
    *   **Nhiệm vụ**: Dữ liệu dự phòng song ngữ cho lịch ra mắt CN/SEA khi API Neon không khả dụng.
5.  **`backgear.json`**:
    *   **Nhiệm vụ**: Chứa tên song ngữ, nguồn nhận, ảnh, chỉ số theo cấp, chi phí nâng và dữ liệu Bộ Sưu Tập Thẻ Hình nền.
6.  **`insignias.json`**:
    *   **Nhiệm vụ**: Chứa đúng 10 Huy Hiệu hợp lệ, nội dung song ngữ và quan hệ tới các hướng dẫn nhận dùng chung. Đây là nguồn seed cho PostgreSQL và dữ liệu dự phòng của frontend.
7.  **`tactics.json`**:
    *   **Nhiệm vụ**: Chứa 19 Thẻ Chiến thuật, chỉ số theo phẩm chất/sao và 13 Khung Chiến thuật. Đây là nguồn seed PostgreSQL và fallback của trang Chiến thuật.
