# Frontend services

Thư mục này chứa lớp giao tiếp giữa giao diện Vue và backend ASP.NET Core.

`apiClient.js` quản lý URL backend, timeout và xử lý HTTP dùng chung.

`characterApi.js` đảm nhiệm:

- gọi API danh sách và chi tiết nhân vật;
- tải toàn bộ các trang summary khi một màn hình cần tra cứu nhân vật theo ID;
- chuyển DTO camelCase của backend về cấu trúc dữ liệu mà các component hiện tại sử dụng;
- giới hạn thời gian chờ để giao diện không bị treo khi API chưa chạy;
- cho phép các View dùng JSON trong `src/data` làm nguồn dự phòng.

`eventApi.js` tải danh sách/chi tiết sự kiện và hợp nhất response API với metadata
giao diện trong `events.json`, ví dụ ngày mở server và nội dung nhiệm vụ theo section.

`masteryApi.js` tải cấu hình Tinh thông theo ba nhóm phe, hệ và cấp; giao diện dùng
`mastery.json` làm nguồn dự phòng khi backend không khả dụng.

`keepsakeApi.js` cung cấp danh sách và chi tiết Kỷ vật từ dữ liệu nhân vật trong PostgreSQL,
đồng thời hợp nhất response với `characters.json` để giữ tương thích và dự phòng ngoại tuyến.

Trong môi trường development, URL mặc định là `http://localhost:5180`. Khi triển khai,
đặt biến `VITE_API_BASE_URL` thành URL public của backend. Nếu không cấu hình URL ở
production, frontend sẽ tiếp tục dùng dữ liệu JSON được đóng gói sẵn.
