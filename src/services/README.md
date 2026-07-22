# Frontend services

Thư mục này chứa lớp giao tiếp giữa giao diện Vue và backend ASP.NET Core.

`apiClient.js` quản lý URL backend, timeout và xử lý HTTP dùng chung.
Các lệnh GET công khai dùng cache trong bộ nhớ để gộp request đồng thời và tránh tải lại dữ liệu
trong thời gian ngắn. Cache liên quan được xóa sau thao tác quản trị thêm/sửa/xóa.

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

`insigniaApi.js` cung cấp danh sách và chi tiết 10 Huy Hiệu hợp lệ cùng các hướng dẫn nhận dùng chung;
`insignias.json` được giữ làm nguồn seed và dữ liệu dự phòng khi backend chưa khả dụng.

`backgearApi.js` tải danh mục Thẻ Hình nền và Bộ Sưu Tập đã được backend bản địa hóa theo ngôn ngữ;
`backgear.json` tiếp tục là nguồn seed và dữ liệu dự phòng khi API chưa chạy.

`tacticApi.js` tải 19 Thẻ Chiến thuật và 13 Khung, bao gồm toàn bộ chỉ số từ 0 đến 7 sao;
`tactics.json` là nguồn seed PostgreSQL và fallback cho giao diện.

`adminApi.js` quản lý phiên JWT trong `sessionStorage` và cung cấp các lệnh đăng nhập, tìm kiếm,
thêm/sửa/xóa Nhân vật, cùng thao tác gắn/đổi/gỡ Kỷ vật. API quản trị không dùng JSON fallback:
backend và `VITE_API_BASE_URL` phải được cấu hình để tránh ghi nhầm vào dữ liệu tĩnh.

`authApi.js` quản lý một phiên chung cho ba vai trò User/Staff/Admin, đăng ký, đăng nhập, làm mới hồ sơ và kiểm tra route guard.
`communityApi.js` cung cấp bình luận sự kiện, diễn đàn, tư vấn, nạp thẻ và các thao tác kiểm duyệt. Các lệnh ghi bắt buộc JWT và không có JSON fallback.
`releaseScheduleApi.js` tải lịch CN/SEA công khai từ Neon và dùng `releaseSchedule.json` làm fallback;
các thao tác quản trị lịch nằm trong `adminApi.js` và yêu cầu JWT Admin.

Trong môi trường development, URL mặc định là `http://localhost:5180`. Khi triển khai Vercel,
frontend gọi API cùng domain nên không cần `VITE_API_BASE_URL`; chỉ đặt biến này khi backend nằm
ở domain khác. Nhân vật, Sự kiện và Lịch ra mắt tự chuyển sang JSON đóng gói nếu API bị lỗi.
