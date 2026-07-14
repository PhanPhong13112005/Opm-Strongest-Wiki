# Thư mục Skill By Tier (`/Skill_By_Tier`)

Thư mục này chứa các tệp biểu tượng kỹ năng và hình ảnh chiêu thức thô, được tổ chức phân cấp rõ ràng theo Bậc (Tier) của nhân vật.

## Cấu trúc thư mục
Được chia thành 7 thư mục con tương ứng với 7 cấp bậc nhân vật trong game:
*   `N/`, `R/`, `SR/`, `SSR/`, `SSR+/`, `UR/`, `UR+/`

## Ý nghĩa hoạt động
*   Mỗi thư mục tier chứa các thư mục con mang tên nhân vật cụ thể (VD: `Skill_By_Tier/SSR/Zombieman (SSR)`).
*   Bên trong mỗi nhân vật là các tệp ảnh kỹ năng thô vừa cào về hoặc do người dùng cập nhật lên.
*   Các tệp ảnh này sau khi được làm sạch, đồng bộ hóa tên file chuẩn (`Skill_base.png`, `Skill_pas.png`, `Skill_ult.png`, v.v.) sẽ được chuyển tới thư mục hoạt động chính `/public/Skill/` để hiển thị trên website.
