# Thư mục Source Code (`/src`)

Thư mục này chứa toàn bộ mã nguồn của ứng dụng Vue 3 / Vite.

## Cấu trúc bên trong
*   `assets/`: Chứa các tài nguyên tĩnh như CSS, font chữ, hoặc logo dùng chung trong mã nguồn.
*   `components/`: Các component tái sử dụng (Shared Components) cho giao diện (như thẻ bài, bộ lọc, v.v.).
*   `data/`: Chứa dữ liệu JSON tĩnh làm nguồn cấp cho website (`characters.json`, `coreLab.json`).
*   `locales/`: Các tệp JSON định nghĩa chuỗi dịch đa ngôn ngữ cho hệ thống Vue I18n (`vi.json`, `en.json`).
*   `router/`: Cấu hình định tuyến Vue Router cho toàn bộ các trang trên ứng dụng (`index.js`).
*   `views/`: Các trang giao diện chính của hệ thống (Trang chủ, Chi tiết tướng, Phòng Thí Nghiệm, Lịch Sự Kiện, Chính Sách, Lịch Sử).

## Luồng Hoạt Động & Logic
1.  **Khởi chạy (`main.js` & `App.vue`):** Ứng dụng khởi động từ `main.js`, cấu hình Vue Router, Vue I18n và mount vào `App.vue`.
2.  **Đa ngôn ngữ (`i18n.js`):** Phát hiện và thay đổi ngôn ngữ động toàn trang thông qua toggle tại thanh điều hướng của `App.vue`.
3.  **Tải Dữ Liệu:** Các View trong `/views` đọc trực tiếp dữ liệu từ các file JSON trong `/data` rồi render giao diện tương ứng theo locale hiện tại (`vi` hoặc `en`).

4.  **Backend & quản trị:** Các màn hình đã chuyển đổi sẽ ưu tiên API ASP.NET Core/PostgreSQL và
    dùng JSON làm fallback tra cứu. Riêng `/admin/login` và `/admin/characters` bắt buộc có backend,
    dùng JWT để quản lý Nhân vật và Kỷ vật, không ghi trực tiếp vào JSON trong trình duyệt.
