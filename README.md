# OPM Strongest Wiki

OPM Strongest Wiki là dự án wiki phi lợi nhuận do người hâm mộ xây dựng cho cộng đồng
**One Punch Man: The Strongest**. Website cung cấp dữ liệu song ngữ Việt/Anh về nhân vật,
kỹ năng, sự kiện, lịch ra mắt CN/SEA và các hệ thống nâng cấp trong game.

> Trạng thái cập nhật: 11/08/2026. Dự án vẫn dùng package version `0.0.0`; lịch sử bên dưới
> được ghi theo ngày thay đổi thực tế thay vì Semantic Versioning.

## Tính năng chính

- Thư viện và chi tiết nhân vật, kỹ năng, hiệu ứng, chỉ số, Kỷ vật và Huy hiệu.
- Tìm nhân vật bằng tên Việt, tên Anh, tên cũ, ID hoặc tiếng Việt không dấu ở cả hai giao diện.
- Lịch ra mắt nhân vật CN/SEA và lịch sự kiện song ngữ.
- Core Skill, Tinh thông, Thẻ Hình nền, Chiến thuật và Huy chương.
- Trang bị với sơ đồ tiến hóa, mô phỏng bốn vị trí, 20 bộ cơ bản/nâng cao và tính nguyên liệu nâng cấp.
- Tinh Luyện Trung Tâm với hai nhánh độc lập, công cụ tính tài nguyên, khóa chỉ số và bảng phẩm chất theo cấp.
- Tinh Thông với điều kiện nhân vật hỗ trợ theo từng nhánh, chi phí nâng bậc và mô phỏng Chuyên Công/Chuyên Thủ trong Đấu Trường.
- Bảng Xếp Hạng Cộng Đồng cho các phẩm UR+, UR, SSR+, SSR, SR và R: giữ nhân vật Cốt Lõi ở hàng riêng,
  tự xếp SS–D theo phiếu nền cộng phiếu cộng đồng và hỗ trợ điều hướng ngang trên mobile.
- Tài khoản cộng đồng với ba vai trò `User`, `Staff`, `Admin`.
- Xác minh Gmail bằng liên kết dùng một lần; tài khoản đã xác minh được bình chọn tối đa 8 nhân vật mỗi phẩm mỗi tháng,
  tài khoản chưa xác minh được bình chọn 1 nhân vật mỗi phẩm mỗi tháng. Mỗi phiếu phải được xác nhận và không thể hủy
  trong kỳ tháng hiện tại.
- Bình luận sự kiện, diễn đàn và Trợ lý dữ liệu ở trạng thái **Thử nghiệm**. Dịch vụ nạp thẻ hiện được hiển thị là **Bảo trì**
  và không nhận đơn/chuyển khoản mới.
- Dashboard quản trị và CRUD Nhân vật, Kỷ vật, Sự kiện, Lịch ra mắt.
- Giao diện responsive, hỗ trợ tiếng Việt/Anh, Vercel Analytics và Speed Insights.

## Kiến trúc và luồng dữ liệu

> Production architecture đã freeze: frontend Vue/Vite trên Vercel, authoritative backend ASP.NET Core,
> PostgreSQL, EF Core là migration owner duy nhất, ASP.NET là auth/payment/ledger owner duy nhất.
> Node/Vercel Functions là **LEGACY / TRANSITIONAL / ROLLBACK ONLY** cho đến cutover; permanent split bị từ chối.
> Trạng thái hiện tại: **NOT READY TO DEPLOY**.

```text
Vercel Vue 3 / Vite
   ├─ VITE_API_BASE_URL ─────────────► ASP.NET Core ──► PostgreSQL
   └─ Public content fallback ───────► bundled JSON (chỉ nơi đã thiết kế rõ)
```

- ASP.NET Core trong [`backend/`](backend/README.md) là final authoritative backend target. Chỉ cutover sau khi toàn bộ
  gate Tier/email/Admin, staging, migration release job, database role, webhook, rollback và routing đạt.
- Vercel Functions trong [`api/`](api/README.md) chỉ giữ inventory/transition/rollback tạm thời; mọi Node writer phải
  bị disable trước khi ASP.NET writer được enable.
- Trang Nhân vật, Sự kiện và Lịch ra mắt ưu tiên dữ liệu API; JSON trong `src/data` là dữ liệu
  seed và fallback khi API/database không khả dụng.
- Public GET được cache ngắn hạn ở client và CDN; cache client được xóa sau thao tác Admin.
- Các thao tác ghi và khu vực vận hành bắt buộc JWT cùng kiểm tra vai trò.

## Công nghệ

- Frontend: Vue 3, Vue Router, Vue I18n, Vite, Tailwind CSS.
- Final API production target: .NET / ASP.NET Core.
- Legacy/transitional API: Node.js Vercel Functions.
- Schema/migration: Entity Framework Core only.
- Database: PostgreSQL (provider production sẽ được xác nhận ở release gate).
- Kiểm thử: Node Test Runner, PGlite và Playwright.
- Triển khai và quan sát: Vercel, Vercel Analytics, Speed Insights.

## Cấu trúc thư mục

```text
OpmWiki/
├── api/                    # LEGACY/TRANSITIONAL Node Functions; không phải final authority
├── backend/                # Authoritative ASP.NET Core API, EF migrations và unit tests
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
Xem [docs/PRODUCTION_ARCHITECTURE.md](docs/PRODUCTION_ARCHITECTURE.md) và
[docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md) trước [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md).

Direct ASP.NET deployment dùng exact key `PublicAppUrl` cùng cấu hình email server; Docker Compose local
nhận wrapper `PUBLIC_APP_URL` và map vào `PublicAppUrl`. Địa chỉ gửi phải thuộc domain đã xác minh; API key
chỉ đặt ở môi trường server và không được đưa vào biến `VITE_*` hoặc mã nguồn phía client.

## Kiểm thử và build

```powershell
npm test
npm run test:integration
npm run build
```

Integration test Playwright dùng Chrome hệ thống và PostgreSQL PGlite cô lập. Kịch bản đăng nhập
Admin qua API, sửa một nhân vật, mở trang chi tiết Vue công khai, xác nhận dữ liệu mới và hoàn
nguyên fixture sau khi chạy.

Mốc kiểm tra gần nhất ngày 11/08/2026: 99 Node tests đạt; Playwright có 50 test đạt và 1 test telemetry
được cấu hình bỏ qua; production build thành công.

## Lịch sử phiên bản

- **11/08/2026:** Thêm Bảng Xếp Hạng Cộng Đồng và dữ liệu phiếu nền có thể chỉnh sửa; phân nhóm Cốt Lõi/SS–D,
  lọc UR+ đến R, xác minh Gmail qua Resend, hạn mức bình chọn theo trạng thái xác minh và tự chuyển kỳ theo tháng
  Việt Nam. Hoàn thiện giao diện mobile, đường dẫn ảnh production, favicon Saitama và nhãn Thử nghiệm cho Trợ lý dữ liệu.
- **10–11/08/2026:** Hoàn thiện Trang bị và Tinh Luyện Trung Tâm; viết lại logic Tinh Thông theo dữ liệu đối chiếu,
  bổ sung mô phỏng Chuyên Công/Chuyên Thủ, hoạt ảnh tương tác rõ ràng và kích thước ảnh sự kiện để hạn chế layout shift.
- **04/08/2026:** Hoàn tất Việt hóa 318 hiệu ứng và 177 tên nhân vật; bổ sung tìm kiếm tên song ngữ.

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
  trợ lý, bình chọn cộng đồng và khu vực vận hành.
- Hệ thống lưu tên đăng nhập, tên hiển thị, mật khẩu đã băm, vai trò và nội dung người dùng gửi.
- Xác minh Gmail lưu trạng thái xác minh và token băm có thời hạn; liên kết chỉ dùng được một lần.
- Yêu cầu nạp chỉ nhận mã tham chiếu và số tiền; webhook SePay được xác thực HMAC và ghi sổ số dư
  idempotent. Không nhập mật khẩu, OTP hoặc toàn bộ thông tin thẻ/ngân hàng.
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
