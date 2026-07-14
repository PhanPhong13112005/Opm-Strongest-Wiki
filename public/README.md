# Thư mục Tài Nguyên Tĩnh (`/public`)

Thư mục này chứa toàn bộ các tài nguyên tĩnh như hình ảnh, biểu tượng, video, gif được Vue tải trực tiếp tại môi trường chạy ứng dụng.

## Các thư mục con chính
1.  **`Characters/`**: Chứa ảnh chân dung nhân vật.
    *   Chia theo các thư mục bậc tướng (N, R, SR, SSR, SSR+, UR, UR+).
    *   Mỗi thư mục chứa ảnh đại diện `.png` hoặc `.webp` của nhân vật và tệp `avatar.png` nền.
    *   Tệp đặc biệt: `actor/` chứa ảnh hoạt họa (art đầy đủ) của tướng phục vụ cho khung xem trước kỹ năng ở trang chi tiết.
2.  **`Skill/`**: Thư mục chứa biểu tượng kỹ năng và video/gif hoạt ảnh của chiêu thức.
    *   Được phân chia theo tên nhân vật (ví dụ: `Subterranean King (SSR)`).
    *   Mỗi thư mục chứa ảnh biểu tượng `Skill_base.png` (thường), `Skill_ult.png` (tuyệt kĩ), `Skill_pas.png` (nội tại), `Skill_Awken.png` (thức tỉnh) và video `.mp4` hoặc `.gif` tương ứng.
3.  **`Core_Skill/`**: Chứa biểu tượng nâng cấp Core.
    *   Phân chia theo thư mục định dạng tiếng Anh không dấu của tướng (VD: `Psykos_V2`, `Boros`...).
    *   Chứa các icon biểu tượng nâng cấp mốc level cốt lõi (`109_c1.png`, `109_c2.png`, v.v.).
    *   `Items/`: Chứa các icon vật phẩm tiêu hao nâng cấp (Ghi chép nghiên cứu, Tâm đắc nghiên cứu...).
4.  **`Class/`**: Chứa icon biểu tượng huy hiệu (S-Class, A-Class, Disaster level Dragon, Disaster level Demon...).
5.  **`Faction/`**: Icon Phe phái (Hero, Monster, Outlaw).
6.  **`Series/`**: Icon các hệ (Chiến đấu, Vũ khí, Hiệp sĩ, Tâm linh).
7.  **`Quality/`**: Các khung nền màu độ hiếm tương ứng cho thẻ nhân vật.
8.  **`Event/` & `Event_other/`**: Ảnh banner và ảnh phần thưởng sự kiện.
