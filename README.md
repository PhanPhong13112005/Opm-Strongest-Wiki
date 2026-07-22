# OPM Strongest Wiki

OPM Strongest Wiki là dự án wiki phi lợi nhuận do người hâm mộ xây dựng cho cộng đồng
**One Punch Man: The Strongest**. Website cung cấp dữ liệu song ngữ Việt/Anh về nhân vật,
kỹ năng, sự kiện, lịch ra mắt CN/SEA và các hệ thống nâng cấp trong game.

> Trạng thái cập nhật: 22/07/2026. Dự án vẫn dùng package version `0.0.0`; lịch sử bên dưới
> được ghi theo ngày thay đổi thực tế thay vì Semantic Versioning.

## Tính năng chính

- Thư viện và chi tiết nhân vật, kỹ năng, hiệu ứng, chỉ số, Kỷ vật và Huy hiệu.
- Lịch ra mắt nhân vật CN/SEA và lịch sự kiện song ngữ.
- Core Skill, Tinh thông, Thẻ Hình nền, Chiến thuật và Huy chương.
- Tài khoản cộng đồng với ba vai trò `User`, `Staff`, `Admin`.
- Bình luận sự kiện, diễn đàn, trợ lý dữ liệu và quy trình yêu cầu nạp.
- Dashboard quản trị và CRUD Nhân vật, Kỷ vật, Sự kiện, Lịch ra mắt.
- Giao diện responsive, hỗ trợ tiếng Việt/Anh, Vercel Analytics và Speed Insights.

## Kiến trúc và luồng dữ liệu

```text
Vue 3 / Vite
   ├─ Public pages ──► Public API ──► PostgreSQL / Neon
   │                       └────────► JSON fallback khi API lỗi
   ├─ Community ─────► JWT API ─────► PostgreSQL / Neon
   └─ Admin ─────────► Admin API ───► PostgreSQL / Neon
```

- Production dùng Vercel Functions trong [`api/`](api/README.md) và Neon PostgreSQL.
- Backend ASP.NET Core trong [`backend/`](backend/README.md) dùng cùng mô hình dữ liệu và hợp đồng API.
- Trang Nhân vật, Sự kiện và Lịch ra mắt ưu tiên dữ liệu API; JSON trong `src/data` là dữ liệu
  seed và fallback khi API/database không khả dụng.
- Public GET được cache ngắn hạn ở client và CDN; cache client được xóa sau thao tác Admin.
- Các thao tác ghi và khu vực vận hành bắt buộc JWT cùng kiểm tra vai trò.

## Công nghệ

- Frontend: Vue 3, Vue Router, Vue I18n, Vite, Tailwind CSS.
- API production: Node.js Vercel Functions.
- Backend: .NET / ASP.NET Core, Entity Framework Core.
- Database: PostgreSQL, Neon Serverless Postgres.
- Kiểm thử: Node Test Runner, PGlite và Playwright.
- Triển khai và quan sát: Vercel, Vercel Analytics, Speed Insights.

## Cấu trúc thư mục

```text
OpmWiki/
├── api/                    # Vercel Functions và schema/seed PostgreSQL
├── backend/                # ASP.NET Core API, migrations và unit tests
├── public/                 # Ảnh, icon, GIF/video và tài nguyên game
├── src/
│   ├── components/         # Component Vue dùng chung
│   ├── data/               # JSON seed/fallback
│   ├── locales/            # Bản dịch VI/EN
│   ├── router/             # Vue Router
│   ├── services/           # API clients, cache và fallback
│   └── views/              # Các trang công khai và portal theo vai trò
├── tests/
│   └── integration/        # Playwright: Admin API → trang Vue công khai
├── playwright.config.js
└── vite.config.js
```

Mỗi khu vực mã nguồn có README riêng để mô tả chi tiết trách nhiệm và quy ước.

## Chạy dự án

Yêu cầu: Node.js 18 trở lên. Để chạy đầy đủ backend cục bộ, cần thêm Docker hoặc PostgreSQL
và .NET SDK tương ứng với dự án backend.

```powershell
npm install
npm run dev
```

Frontend development chạy tại `http://localhost:5173`. Mặc định frontend gọi backend tại
`http://localhost:5180`; có thể thay đổi bằng `VITE_API_BASE_URL`.

Chạy PostgreSQL và ASP.NET Core bằng Docker:

```powershell
docker compose -f backend/docker-compose.yml up --build
```

Không commit `DATABASE_URL`, connection string, mật khẩu Admin hoặc JWT signing key vào Git.
Xem [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md) để biết cấu hình production.

## Kiểm thử và build

```powershell
npm test
npm run test:integration
npm run build
```

Integration test Playwright dùng Chrome hệ thống và PostgreSQL PGlite cô lập. Kịch bản đăng nhập
Admin qua API, sửa một nhân vật, mở trang chi tiết Vue công khai, xác nhận dữ liệu mới và hoàn
nguyên fixture sau khi chạy.

## Lịch sử phiên bản

- **11–16/07/2026:** Nền tảng Vue, dữ liệu nhân vật, Core Skill, Sự kiện, Tactics, Huy chương,
  Kỷ vật, Huy hiệu và hoàn thiện giao diện song ngữ.
- **17–18/07/2026:** Thêm ASP.NET Core/PostgreSQL; chuyển Mastery, Keepsake, Insignia, Backgear,
  Tactics sang backend; sửa dữ liệu và tài nguyên production.
- **19–20/07/2026:** JWT Admin, quản lý nhân vật và các portal User/Staff/Admin.
- **22/07/2026:** Vercel Functions + Neon cho cộng đồng/Admin; public API Neon cho Nhân vật,
  Sự kiện và Lịch ra mắt; JSON fallback, cache client/CDN và integration test Playwright.

Chi tiết xem [`CHANGELOG.md`](CHANGELOG.md) hoặc trang `/history` trên website.

## Quyền riêng tư và an toàn

- Việc đọc wiki công khai không yêu cầu tài khoản. Tài khoản chỉ cần cho bình luận, diễn đàn,
  trợ lý, yêu cầu nạp và khu vực vận hành.
- Hệ thống lưu tên đăng nhập, tên hiển thị, mật khẩu đã băm, vai trò và nội dung người dùng gửi.
- Yêu cầu nạp chỉ nhận phương thức, mã tham chiếu và số tiền. Không nhập mật khẩu, OTP hoặc toàn
  bộ thông tin thẻ/ngân hàng.
- JWT và thông tin phiên được lưu trong `sessionStorage`; production sử dụng HTTPS.
- Telemetry hiệu năng/truy cập được xử lý thông qua Vercel Analytics và Speed Insights.

Xem nội dung đầy đủ tại trang `/privacy`.

## Bản quyền và nguồn tham khảo

OPM Strongest Wiki là dự án fan-made, không liên kết hoặc được bảo trợ bởi chủ sở hữu thương hiệu,
nhà phát triển hay nhà phát hành game.

- One Punch Man, tên nhân vật và tài sản liên quan thuộc các tác giả/chủ sở hữu tương ứng.
- Hình ảnh, biểu tượng, hoạt ảnh và dữ liệu game thuộc nhà phát triển/nhà phát hành tương ứng.
- Mã nguồn, giao diện và tài liệu nguyên gốc của dự án: © 2026 OPM Strongest Wiki contributors.
- Nguồn tham khảo gồm dữ liệu trong game, YouTube, các nhóm cộng đồng Facebook, OPM Wiki và nội
  dung cộng đồng do [ParkSoongNak](https://www.facebook.com/ParkSoongNak/) chia sẻ.

Việc ghi nguồn không chuyển giao quyền sở hữu. Nếu bạn là chủ sở hữu quyền và muốn chỉnh sửa ghi
nhận hoặc yêu cầu gỡ nội dung, vui lòng liên hệ ban quản trị qua các kênh cộng đồng.
