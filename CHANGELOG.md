# Nhật Ký Phiên Bản OPM Strongest Wiki

Dưới đây là toàn bộ lịch sử các phiên bản phát triển của dự án OPM Strongest Wiki, ghi dấu hành trình từ bản dựng đầu tiên tới phiên bản hoàn thiện chính thức.

## 🚀 Phiên bản 1.0 - Khởi tạo & Định hình thiết kế UI/UX
- **Thiết lập Project:** Khởi tạo dự án bằng Vue 3, Vite và Tailwind CSS.
- **Xây dựng Giao diện (Cyberpunk/Dark Mode):** Thiết kế tổng thể với tông màu tối bóng bẩy, sử dụng hiệu ứng glow, glassmorphism và gradient để tạo cảm giác "Premium" cho một tựa game thẻ tướng.
- **Phát triển Components Cốt lõi:** Code trang chủ (Danh sách thẻ bài) với chức năng phân loại theo độ hiếm, phe phái và hệ. Code trang chi tiết (Detail View) với layout siêu ngầu gồm ảnh nền mờ, thanh chỉ số Gốc / PVP, và hệ thống tab kỹ năng.

## 🕷️ Phiên bản 1.1 - Cào & Xử lý Dữ liệu Nhân vật
- **Xây dựng Scraper:** Viết các script Python (`scraper.py`) để tự động cào hàng loạt dữ liệu nhân vật, chỉ số (HP, ATK, DEF, SPD), và chi tiết kỹ năng từ các nguồn dữ liệu có sẵn trên web.
- **Làm sạch Dữ liệu (Data Cleansing):** 
  - Gộp tất cả các thẻ bài (N, R, SR, SSR, SSR+, UR, UR+) vào chung một tệp `characters.json`.
  - Khắc phục các lỗi hiển thị font chữ (bị lỗi ký tự tiếng Việt hoặc ký tự đặc biệt).
  - Chuẩn hóa tên kỹ năng, tên hiệu ứng, và đưa vào cấu trúc JSON nhất quán.

## 🎬 Phiên bản 1.2 - Hệ thống Kỹ năng & Hoạt ảnh Thông minh
- **Tab Kỹ năng Trực quan:** Chia kỹ năng ra các phân mục: Kỹ năng thường, Tuyệt kĩ, Nội tại, và Thức tỉnh.
- **Cơ chế Kế thừa Hoạt ảnh (Smart Animation):** 
  - Xử lý việc các kỹ năng nâng cấp (VD: Siêu Tuyệt Kĩ, Bị động cực hạn) tự động kế thừa hoạt ảnh (`.gif` / `.mp4`) của kỹ năng gốc (Tuyệt kĩ, Nội tại) nếu hệ thống không có file riêng.
  - Tối ưu hiển thị Video/GIF với giao diện khung viền tự động đổ bóng theo màu đặc trưng của từng hệ nhân vật.

## 🖼️ Phiên bản 1.3 - Quản lý Hình ảnh, Avatar & Keepsakes
- **Hệ thống Ảnh Đại diện (Avatars):** Tái cấu trúc thư mục hình ảnh để Vue có thể tự động ánh xạ ảnh đại diện dựa trên thư mục Tier (Ví dụ: Tìm `UR+.png` trong thư mục `G5 (UR+)`). Khắc phục các lỗi mất ảnh do lệch đường dẫn.
- **Hệ thống Kỷ vật (Keepsakes):** Tích hợp hiển thị icon Kỷ vật (Vũ khí duyên) bên cạnh các Tuyệt kĩ, giúp người dùng biết vũ khí nào cần thiết để mở khóa Siêu Tuyệt Kĩ.

## 🛡️ Phiên bản 1.4 - Đồng bộ Logic Game (Phe phái & Huy hiệu)
- **Xử lý Huy hiệu Phân lớp (Badges):**
  - Đồng bộ logic hiển thị của game: Nhân vật phe Anh Hùng / Tội Phạm sử dụng Huy hiệu Tier (UR+ hiển thị S-Class, SSR hiển thị A-Class,...).
  - Nhân vật phe Quái Nhân hiển thị Mức độ thảm họa (Dragon, Demon, Tiger).
- **Xử lý Ngoại lệ Siêu Dị:** Sửa lỗi logic phức tạp cho các nhân vật đặc thù như **Gale Wind** và **Hellfire Flame**. Đảm bảo bản UR (Người) thuộc phe Tội Phạm (Huy hiệu S-Class), trong khi bản SSR (Quái vật) thuộc phe Quái Nhân (Huy hiệu Demon). Cập nhật **Sonic** luôn là Tội Phạm.

## 📅 Phiên bản 1.5 - Tích hợp Lịch trình Ra mắt (Release Timeline)
- Tích hợp lịch sử ra mắt của nhân vật ở cả hai máy chủ: **Server Trung Quốc** và **Server SEA**.
- Viết Python script đọc ảnh lịch và các tệp văn bản từ bạn để đối chiếu, cấy (inject) chính xác ngày ra mắt vào từng nhân vật cũ (dàn LSSR).
- Bổ sung cơ chế Fallback: Chỉ hiển thị ngày ra mắt nếu có dữ liệu thực tế, các nhân vật chưa xác định ngày sẽ hiện "Không xác định", không được bịa ngày mặc định.

## ✨ Phiên bản 1.6 - Chú thích Hiệu ứng Thông minh (Effect Glossary)
- **Chú thích Hiệu ứng (Effect Glossary):** 
  - Khắc phục lỗi trùng lặp hiệu ứng giữa các thẻ bài bằng cách xây dựng thuật toán quét chuỗi: Một hiệu ứng chỉ được giải thích ở phần chú thích nếu từ khóa đó (VD: `[Gây Mù]`) **thực sự xuất hiện** trong mô tả kỹ năng của thẻ bài đang xem.
- **Hoàn thiện Tương tác UI:** Thêm các micro-animations (hiệu ứng flash) khi bấm vào từ khóa hiệu ứng để cuộn tự động (scrollIntoView) mượt mà tới phần giải thích. Đổ bóng (drop-shadow) chữ và hình ảnh để web mang cảm giác 3D có chiều sâu.

## 🧬 Phiên bản 1.7 - Phân hệ Phòng Nghiên Cứu (Core Lab)
- **Thiết kế Giao diện Core Lab:** Xây dựng trang `/core-lab` để hiển thị chi tiết các kỹ năng Core và lộ trình nâng cấp (Level Milestones) của các tướng hệ Core.
- **Tính toán Level Động:** Hiển thị tự động tài nguyên cần thiết và các mốc chỉ số/kỹ năng được mở khóa trong một khoảng Level nhất định (Ví dụ: Level 0 -> 4).
- **Trình bày Kỹ năng Core Chuyên Sâu:** 
  - Mô phỏng chính xác tooltip trong game bằng cách tách [Hiệu quả sơ cấp], [Hiệu quả cao cấp] và [Điều kiện] thành các khối văn bản (dark box) có màu sắc và format rõ ràng.
  - Xử lý làm gọn chuỗi điều kiện kích hoạt (tự động giấu số "1" và định dạng lại số lượng).
  - Tích hợp Icon kỹ năng và Icon mốc nâng cấp một cách hài hòa, loại bỏ hoàn toàn sự trùng lặp văn bản.
- **Tối ưu Responsive Tuyệt Đối:** Xử lý layout để trên Desktop các khối text dàn trải cân đối (side-by-side) không bị quá to, còn trên Mobile thì Icon và Tiêu đề gộp chung hàng, nhường toàn bộ chiều ngang cho hộp mô tả kỹ năng, giúp dễ đọc nhất có thể.
- **Quản lý Tài nguyên Dùng chung:** Định tuyến lại các vật phẩm nâng cấp dùng chung (Tâm Đắc Nghiên Cứu, Ghi Chép Nghiên Cứu) vào thư mục `Core_Skill/Items/` để hệ thống tự động nhận diện và hiển thị.

## 🎪 Phiên bản 1.8 - Hệ thống Sự Kiện & Tối ưu Hóa Mobile
- **Thiết kế Giao diện Sự Kiện (EventsView & EventDetailView):** Xây dựng module quản lý và hiển thị các sự kiện (Banner, Task, Điều kiện, Phần thưởng) cực kỳ trực quan với khả năng chuyển đổi ngôn ngữ (Việt - Anh) linh hoạt.
- **Data Engineering Sự Kiện:** Tích hợp logic xử lý tinh vi cho từng loại sự kiện đặc thù:
  - Cấu trúc hiển thị đa tầng cho *Gale Wind Special Training* (Từng tiến trình cụ thể).
  - Ánh xạ hoàn hảo các mốc nạp (Recharge Milestones) và phần quà cho các sự kiện *Star Wish Sprint*, *Terrible Tornado's Blessing*, *Supershare*, và *Whac-A-Mole*.
- **Tối ưu Hóa Giao Diện Điện Thoại (Mobile UX):** 
  - Ẩn hoàn toàn thanh cuộn ngang (scrollbar) thô kệch.
  - Tích hợp hiệu ứng cuộn mượt (Snap Scrolling).
  - Thiết kế bộ nút mũi tên điều hướng (Left/Right Arrows) với nền gradient đổ bóng, giúp trải nghiệm vuốt Tab sự kiện trên smartphone mượt mà và trực quan nhất.

## 🌟 Phiên bản 2.0 - Tích hợp Core Detail, Fix i18n & Chính sách Bảo mật
- **Tích hợp Core vào Trang Chi Tiết:**
  - Tự động hiển thị thêm tab "Cốt Lõi" đối với các nhân vật có sở hữu Core Skill trong `DetailView.vue`.
  - Hiển thị tóm tắt hai mốc quan trọng nhất: Level 1 (Cơ bản) và Level 4 (Eccentric Power · II) cùng mô tả hiệu ứng chi tiết.
  - Sửa logic xử lý đường dẫn hình ảnh cho Core Skill: tự động mapping linh hoạt sang thư mục `/Core_Skill/` tương ứng của từng nhân vật hoặc fallback về ảnh chân dung Core nếu thiếu ảnh mốc.
  - Tích hợp nút điều hướng nhanh "Xem chi tiết Phòng Nghiên Cứu", tự động chuyển hướng và chọn đúng tướng đang xem trong Core Lab.
- **Tối ưu Hóa Giao Diện và i18n:**
  - Khắc phục triệt để lỗi hiển thị mã code dịch `DETAIL.SKILL_TABS.CORE` bằng cách cấu hình ngôn ngữ chính xác ở `vi.json` và `en.json`.
  - Khắc phục lỗi hiển thị ảnh động xem trước (animation preview) của tab Core bằng cách liên kết trực tiếp với `imageURL` của nhân vật.
  - Sửa lỗi layout trên danh sách thẻ kỹ năng phải bằng cách thêm `flex-shrink-0` cho các thẻ Core và nút chuyển trang, ngăn chặn việc giao diện bị co kéo hay cắt mất nội dung.
- **Trang Chính sách Bảo mật & Lịch sử phát triển:**
  - Tạo mới trang `/privacy` (`src/views/PrivacyView.vue`) và `/history` (`src/views/HistoryView.vue`) hỗ trợ đầy đủ song ngữ Anh - Việt.
  - Trình bày rõ ràng mục đích phi lợi nhuận (Fan-made Wiki), các chính sách bảo mật dữ liệu cơ bản (không lưu cookie cá nhân, không yêu cầu tài khoản), và tuyên bố sử dụng hợp lý (Fair Use) bản quyền hình ảnh.
  - Liên kết trực tiếp trang chính sách và lịch sử tại Footer (chân trang) của ứng dụng.
- **Dọn dẹp mã nguồn:** Loại bỏ toàn bộ các script Python bổ trợ trung gian và các file văn bản tạm (`types.txt`, `log.txt`, `test.py`...) trước khi đẩy mã nguồn sạch lên GitHub.

---
*Dự án OPM Wiki đã trải qua vô số dòng code và script Python khác nhau. Thành quả hiện tại là một hệ thống web hiện đại, được tối ưu hoàn toàn tự động dựa trên tệp JSON, hiển thị chuẩn xác logic đặc thù nhất của OPM The Strongest.*
