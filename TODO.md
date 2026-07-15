# Danh sách các lỗi hiển thị cần sửa (TODO List)

_Ghi chú: Tài liệu này được tạo ra để lưu trữ và theo dõi các lỗi hiển thị (UI/UX bugs) còn tồn đọng trên OPM Strongest Wiki, chuẩn bị cho phiên làm việc tiếp theo._

## 🐛 Các vấn đề hiện tại cần kiểm tra (Dự kiến):

_(Bạn có thể điền thêm chi tiết vào đây nếu phát hiện ra lỗi cụ thể)_

- [x] **Lỗi hiển thị hình ảnh (Images & Avatars):**
  - Đã xử lý ảnh vật phẩm Core Lab (vào thư mục Items), sửa lỗi ẩn icon mốc kỹ năng trên điện thoại.
- [x] **Lỗi Bố cục (Layout & Responsiveness):**
  - Đã khắc phục triệt để trên trang Core Lab (đóng gói Layout linh hoạt side-by-side trên Desktop và stack tự động trên Mobile).
- [x] **Vấn đề về Dữ liệu Fallback:**
  - Đã xử lý các biến trống (null) bằng Fallback (như "Đang cập nhật" cho text, làm sạch các mốc chưa có icon).
- [x] **Màu sắc & Contrast:**
  - Đã làm lại bộ màu tooltip in-game (chữ vàng đồng, cam, text xám nhạt trên nền tối `bg-[#121318]`), độ tương phản cực tốt.
- [x] **Lỗi thẻ nhân vật đặc thù:**
  - Đã xử lý xong các ca khó từ trước (Badges của Gale Wind, Hellfire Flame) và các logic ID vật phẩm hệ Core.
- [x] **Lỗi hiển thị Lịch sử (Fake Dates):**
  - Đã lọc sạch ngày ảo của Zombieman UR+ và đồng bộ từ trước.

---

**🚀 Tính năng mới cần làm cho ngày mai:**

- [ ] **Trang Kỷ vật:** Xây dựng danh sách và chi tiết các Kỷ vật, tập trung vào thông tin "Lấy ở đâu" (Nguồn gốc nhận).
- [ ] **Trang Huy Hiệu:** Thiết kế trang tổng hợp các loại Huy Hiệu, chỉ rõ nguồn gốc "Lấy ở đâu" và cách sở hữu.
- [ ] **Trang Hướng Dẫn Tân Thủ:** Soạn thảo và thiết kế trang "Hướng Dẫn người chơi mới 10 ngày đầu" với lộ trình cày cuốc, mẹo chơi và cách tiêu thụ tài nguyên hiệu quả nhất.
- [ ] **Đồng bộ Ngôn ngữ (Localization):** Rà soát và dịch thuật lại toàn bộ Wiki, khắc phục tình trạng "nửa nạc nửa mỡ" (một số trang chưa sang tiếng Việt hẳn, cũng chưa ra tiếng Anh hẳn).

---

**💡 Ghi chú cho ngày mai:**
Khi bắt đầu phiên làm việc mới, chúng ta sẽ ưu tiên bắt tay vào các Trang tính năng mới này nhé! Tôi sẽ lo phần Code và Thiết kế giao diện (UI/UX).

**📋 Phần việc của bạn (Chuẩn bị dữ liệu):**

- [ ] Chuẩn bị thông tin Nguồn gốc ("Lấy ở đâu") của các loại Kỷ vật và Huy Hiệu để tôi đưa vào hệ thống.
- [ ] Soạn sẵn dàn ý hoặc các gạch đầu dòng kinh nghiệm cày cuốc trong "10 ngày đầu" để tôi thiết kế thành trang Cẩm nang đẹp mắt.
- [ ] Trong lúc rảnh, nếu bạn lướt Wiki mà thấy chỗ nào chữ tiếng Anh/tiếng Việt lẫn lộn thì hãy chụp màn hình lại để ngày mai ném cho tôi sửa một lượt luôn nhé!

Hôm nay chúng ta sẽ làm 2 trang:
1 Trang về TÍnh năng Huy Chương (level 70 mở)
1 Trang về Tính năng Chiến thuật (level 75 mở)
[Feature](file;file:///d%3A/Code/OpmWiki/public/Feature)
bạn có thể đổi tên ảnh để dễ hiểu
