# OPM Strongest Wiki

OPM Strongest Wiki là trang tra cứu bách khoa toàn thư dành cho tựa game **One Punch Man: The Strongest**. 
Dự án cung cấp giao diện trực quan, hiện đại, tối ưu cho việc tra cứu thông tin chi tiết các nhân vật (cấp bậc UR, UR+, SSR+,...), kỹ năng, chỉ số, ngày ra mắt trên các máy chủ và hoạt ảnh xuất chiêu của từng nhân vật.

## 🌟 Tính năng nổi bật
- **Giao diện Cyberpunk & Tối màu (Dark Mode):** Thiết kế bóng bẩy với các hiệu ứng glow, glassmorphism, và micro-animations.
- **Thư viện nhân vật đa dạng:** Phân loại nhân vật theo Phe (Faction), Hệ (Class), cấp bậc (Tier).
- **Hệ thống kỹ năng chi tiết:** Bao gồm Tuyệt kĩ, Siêu tuyệt kĩ, Nội tại, và các cấp Thức tỉnh với khả năng hiển thị hoạt ảnh GIF/MP4 thực tế.
- **Tự động kế thừa hoạt ảnh (Smart Animation Inheritance):** Các kỹ năng nâng cấp (như Siêu tuyệt kĩ, Bị động 5 sao) tự động kế thừa hoạt ảnh từ kỹ năng gốc nếu không chỉ định file riêng.
- **Dòng thời gian ra mắt (Release Timeline):** So sánh lịch sử ngày ra mắt và ngày trở lại của nhân vật giữa các máy chủ (Server Trung Quốc và Server SEA).
- **Chỉ số Gốc & Chỉ số PVP:** Mô phỏng các chỉ số cơ bản của nhân vật bằng thanh tiến trình (Progress Bar) trực quan.

## 🛠️ Tech Stack
- **Framework:** Vue 3 (Composition API & `<script setup>`)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** Vue Router
- **Icons & Fonts:** FontAwesome / Google Fonts (Inter/Roboto)

## 📁 Cấu trúc thư mục

```
OpmWiki/
├── public/                 # Các tài nguyên dùng chung (Images, Animations, Icons)
│   ├── Animation/          # Chứa các file GIF/MP4 hoạt ảnh kỹ năng của nhân vật
│   ├── Characters/         # Chứa hình ảnh của các nhân vật (Artwork, Avatar)
│   ├── Class/              # Icon của các hệ (Công nghệ, Vũ trang, v.v)
│   ├── Faction/            # Icon của các phe (Anh hùng, Quái vật, Tội phạm)
│   └── Mastery/            # Hình ảnh liên quan đến tính năng tinh thông
├── src/
│   ├── assets/             # CSS toàn cục (style.css, index.css)
│   ├── components/         # Các component UI tái sử dụng (CharacterCard, Navigation)
│   ├── data/               # Nơi chứa Database tĩnh
│   │   └── characters.json # File JSON lưu trữ MỌI DỮ LIỆU của nhân vật
│   ├── views/              # Các trang chính (HomeView, DetailView, MasteryView)
│   ├── App.vue             # Component gốc
│   └── main.js             # Entry point của ứng dụng
├── tailwind.config.js      # Cấu hình Tailwind CSS
└── vite.config.js          # Cấu hình Vite
```

## 📖 Các Quy tắc Logic Cốt lõi (Business Rules)
Trong quá trình xây dựng Wiki, một số logic cốt lõi đã được thiết lập để đảm bảo dữ liệu hiển thị chuẩn xác với cơ chế của game OPM: The Strongest.

### 1. Logic Huy hiệu Phân lớp (Class / Tier Badges)
- **Nhân vật phe Anh Hùng / Võ Thuật / Tội Phạm:** Sẽ sử dụng hệ thống huy hiệu dựa trên độ hiếm (Tier-based fallback).
  - Cấp `UR+` và `UR` tự động hiển thị huy hiệu **Class S**.
  - Cấp `SSR` hiển thị huy hiệu **Class A** (Đầu lâu bạc có cánh).
  - Cấp `SR` hiển thị huy hiệu **Class B**.
  - Cấp `R` hiển thị huy hiệu **Class C**.
- **Nhân vật phe Quái Nhân (Monster):** KHÔNG tuân theo độ hiếm. Quái Nhân sẽ hiển thị **Mức độ Thảm họa (Threat Level)** dựa trên trường `class` hoặc `classLevel` trong file JSON (Dragon, Demon, Tiger).
- **Ngoại lệ (Exceptions):**
  - **Gale Wind & Hellfire Flame:** Ở bản UR (dạng người), họ thuộc phe **Tội Phạm (Outlaw)** nên sẽ nhận huy hiệu Class S. Ở bản SSR (dạng quái), họ thuộc phe **Quái Nhân (Monster)** nên sẽ nhận huy hiệu mức độ thảm họa Demon.
  - **Sonic:** Luôn thuộc phe Tội Phạm và dùng hệ thống Class theo Tier.

### 2. Logic Lịch sử Ra mắt (Release Dates)
- Game theo dõi ngày ra mắt của Server Trung (`releaseTrung`) và Server SEA (`releaseDate` hoặc `releaseSea`).
- **Quy tắc:** Nếu một nhân vật hoàn toàn chưa có thông tin lịch sử nào, UI sẽ hiển thị **"Không xác định"** hoặc tự động ẩn hẳn khối Lịch sử, tuyệt đối không tự bịa (hardcode) ngày mặc định.

### 3. Logic Chú thích Hiệu ứng (Effect Glossary)
- Để tránh việc các phiên bản (UR, SSR, SSR+) của cùng một nhân vật bị "trùng lặp" hoặc vay mượn sai chú thích hiệu ứng của nhau, một quy tắc quét nghiêm ngặt được áp dụng.
- **Quy tắc:** Một hiệu ứng (ví dụ `[Gây Mù]`) chỉ được hiển thị ở bảng Chú Thích nếu như từ khóa đó THỰC SỰ xuất hiện (và được bọc trong ngoặc vuông `[...]`) bên trong mô tả kỹ năng (`skills` / `core`) của chính thẻ bài đó.

### 4. Logic Load Ảnh Avatar / Kỷ vật
- Giao diện tự động quy chiếu đường dẫn ảnh đại diện theo Tier. Ví dụ: `G5 (UR+)` thì frontend sẽ tìm ảnh tại `public/Characters/G5 (UR+)/UR+.png`.
- Khi cần cập nhật ảnh Kỷ vật, hãy đảm bảo ảnh được copy vào đúng thư mục Tier của nhân vật đó.


## 🚀 Cách cài đặt và chạy nội bộ

1. **Yêu cầu hệ thống:** Có cài đặt sẵn [Node.js](https://nodejs.org/).
2. **Cài đặt dependencies:**
   Mở terminal tại thư mục gốc của dự án và chạy:
   ```bash
   npm install
   ```
3. **Chạy server phát triển (Development):**
   ```bash
   npm run dev
   ```
   Trang web sẽ khả dụng tại `http://localhost:5173`.
4. **Build bản Production:**
   ```bash
   npm run build
   ```
   Code đã được tối ưu hóa sẽ nằm trong thư mục `dist/`.