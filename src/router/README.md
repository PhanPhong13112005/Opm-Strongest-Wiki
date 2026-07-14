# Thư mục Định Tuyến (`/src/router`)

Thư mục này quản lý cấu hình phân trang và điều hướng URL của toàn bộ ứng dụng.

## Cấu trúc định tuyến (`index.js`)
Sử dụng thư viện `vue-router` phiên bản 4 để thiết lập lịch sử web (`createWebHistory`) và khai báo danh sách các tuyến đường (routes):

*   `/`: Trang chủ (`HomeView.vue`) hiển thị danh sách toàn bộ các nhân vật.
*   `/characters`: Trang danh sách nhân vật chuyên sâu.
*   `/character/:id`: Trang chi tiết kỹ năng và thông số của một tướng cụ thể (`DetailView.vue`).
*   `/mastery`: Trang Tinh Thông hiển thị logic bổ trợ.
*   `/core-lab`: Trang Phòng Nghiên Cứu Core (`CoreLabView.vue`).
*   `/keepsakes`: Trang Kỷ Vật.
*   `/insignias`: Trang Huy Hiệu.
*   `/events`: Trang Danh Sách Sự Kiện.
*   `/events/:id`: Trang Chi Tiết Sự Kiện cụ thể.
*   `/privacy`: Trang Chính Sách Bảo Mật.
*   `/history`: Trang Lịch Sử Phiên Bản.

## Các tùy biến đặc biệt
*   `scrollBehavior`: Cấu hình tự động cuộn trang lên đầu (`top: 0`) mỗi khi chuyển tuyến đường (route change) trừ khi có lịch sử cuộn trước đó (`savedPosition`).
*   `props: true` hoặc sử dụng hàm mapping để truyền trực tiếp tham số động từ URL thành `props` trong component nhận được.
