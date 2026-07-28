# PROJECT_CONTEXT.md

> Tài liệu ngữ cảnh kỹ thuật dành cho các phiên làm việc tiếp theo.
>
> Cập nhật theo trạng thái mã nguồn được kiểm tra ngày 28/07/2026. Những nội dung liên quan đến hạ tầng production đang chạy thực tế, cấu hình trên Vercel/Neon và trạng thái dịch vụ bên ngoài được đánh dấu **chưa xác minh** nếu không thể kết luận chỉ từ repository.

## Mốc kiểm tra gần nhất

- Tài liệu được đối chiếu lại với repository ngày 28/07/2026 tại commit `abd4a43 — Fix mobile navigation and update medal content`.
- Branch tại thời điểm đối chiếu: `agent/role-portals-coupon`.
- Commit và branch trên chỉ là mốc kiểm tra gần nhất, không phải trạng thái cố định lâu dài của dự án. Luôn chạy `git status` và kiểm tra lịch sử Git ở đầu phiên làm việc mới.
- Trạng thái mới nhất của remote `main` **chưa xác minh** vì lần đối chiếu này không chạy `git fetch`.

### Thay đổi chưa commit tại lần kiểm tra gần nhất

- `public/Feature/medals/Mirage_trial/ai_20.png` đang bị xóa cục bộ.
- `public/Feature/medals/Mirage_trial/ai_5.png` chưa được Git theo dõi.
- `src/views/MedalsView.vue` vẫn tham chiếu `ai_20.png`; nếu commit hoặc deploy trạng thái này, ảnh mốc 20 có thể bị lỗi.
- Đây là trạng thái working tree tại thời điểm kiểm tra, không phải đặc điểm kiến trúc. Không tự ý xóa `ai_5.png`, khôi phục `ai_20.png` hoặc sửa mapping trước khi xác nhận mục đích của người dùng.

## 1. Mục tiêu dự án

**OPM Strongest Wiki** là một wiki cộng đồng song ngữ Việt/Anh cho game **One Punch Man: The Strongest**. Dự án tập trung vào:

- Tra cứu nhân vật, kỹ năng, hiệu ứng, lịch phát hành CN/SEA và sự kiện.
- Tra cứu các hệ thống phát triển nhân vật: Core Skill, Mastery, Keepsake, Insignia, Backgear, Tactics và Medals.
- Cung cấp diễn đàn, bình luận sự kiện và công cụ cố vấn đội hình.
- Quản lý tài khoản, vai trò, số dư và nạp tiền bằng coupon hoặc chuyển khoản ngân hàng.
- Cung cấp khu vực Staff/Admin để kiểm duyệt nội dung, quản lý người dùng và CRUD dữ liệu wiki.

Đây là dự án fan-made, không phải sản phẩm chính thức của nhà phát hành game.

## 2. Công nghệ sử dụng

### Frontend

Các range được khai báo trực tiếp trong `package.json`:

- Vue `^3.4.21`, Composition API và `<script setup>`.
- Vue Router `^4.6.4`.
- vue-i18n `^9.14.5`.
- Vite `^5.2.0`.
- Tailwind CSS `^3.4.4`, PostCSS `^8.4.38`, Autoprefixer `^10.4.19`.
- PixiJS `^7.4.3` và pixi-spine `^4.0.6` cho nội dung đồ họa/animation.
- Vercel Analytics `^2.0.1` và Speed Insights `^2.0.0`.

Phiên bản dependency resolved trong lockfile **chưa xác minh** ở lần đối chiếu gần nhất vì `package-lock.json` chưa được đọc lại. Không dùng phiên bản resolved từ lần phân tích cũ như thể đó là range được khai báo trong `package.json`.

### Backend

Dự án có hai backend cùng tồn tại:

1. **Vercel Functions**
   - Node.js, ES modules.
   - Entry point chính: `api/index.js`.
   - PostgreSQL qua `@neondatabase/serverless` `1.0.0`.
   - Đây là backend được cấu hình cho mô hình deploy frontend và API cùng domain trên Vercel.

2. **ASP.NET Core**
   - .NET/ASP.NET Core `net10.0`.
   - Entity Framework Core `10.0.0`.
   - Npgsql EF Core provider `10.0.0`.
   - JWT Bearer `10.0.0`.
   - Swagger/Swashbuckle `10.2.3`.
   - Có thể chạy cục bộ bằng Docker hoặc deploy như một backend độc lập.

### Database và kiểm thử

- PostgreSQL; môi trường Docker dùng image `postgres:17-alpine`.
- Production hướng tới Neon PostgreSQL; trạng thái kết nối production hiện tại **chưa xác minh**.
- Frontend/Node: Node test runner; `package.json` khai báo PGlite `^0.5.4` và Playwright `^1.61.1`. Phiên bản resolved **chưa xác minh**.
- .NET: xUnit `2.9.3`, EF Core InMemory `10.0.0`, coverlet `6.0.4`.

### Công cụ triển khai

- Vercel cho SPA và Node Functions.
- Docker/Docker Compose cho ASP.NET Core và PostgreSQL cục bộ.
- Tài liệu có đề cập Back4app/Railway cho backend .NET; trạng thái triển khai thực tế **chưa xác minh**.

### Ghi chú dependency

- README yêu cầu Node.js `>=18`, nhưng `package.json` chưa khai báo `engines` và repository chưa pin phiên bản Node.
- `sharp` đang có trong dependency nhưng chưa tìm thấy nơi sử dụng rõ ràng.
- Phiên bản ứng dụng trong `package.json` vẫn là `0.0.0`; chưa có quy trình versioning rõ ràng.

## 3. Kiến trúc hệ thống

### Tổng thể

Kiến trúc hiện tại là dạng **hybrid**, gồm SPA modular và hai lựa chọn backend:

```text
Vue SPA
  ├─ Public data services ──> Vercel Functions ──> Neon PostgreSQL
  │          └──────────────> Static JSON fallback
  └─ Có thể cấu hình ───────> ASP.NET Core API ──> PostgreSQL
```

### Frontend

- `src/main.js` khởi tạo Vue, router và i18n.
- `src/App.vue` là application shell.
- `src/router/index.js` định nghĩa route, lazy-load view và route guard theo vai trò.
- Điều hướng mobile trong `src/App.vue` đã được đồng bộ với các route hiện có và nay có liên kết tới Core Lab và Huy chương. Đây là cập nhật điều hướng; hai trang chức năng đã tồn tại từ trước.
- `src/views/` chứa các màn hình theo chức năng.
- `src/components/` chứa UI dùng lại.
- `src/services/` gom logic gọi API, auth, cache và xử lý request.
- `src/data/` và `public/Data/` cung cấp dữ liệu tĩnh/nguồn fallback.
- `apiClient` dùng timeout 8 giây và memory cache cho GET trong 60 giây.
- Khi API public không khả dụng hoặc endpoint chưa tồn tại, nhiều view chuyển sang JSON fallback.

### Vercel Functions

- `api/index.js` là router/entry point tổng.
- Các nhóm handler chính gồm auth, admin và community.
- SQL được thực thi trực tiếp qua Neon driver; không có repository layer riêng.
- Schema được tạo bằng `CREATE TABLE IF NOT EXISTS` lúc runtime.
- `api/sepay-webhook.js` là endpoint riêng để giữ raw body phục vụ xác minh chữ ký webhook.

Backend này hiện chỉ cung cấp API dữ liệu wiki cho characters, events và release schedule. Các module Mastery, Keepsake, Insignia, Backgear và Tactics chủ yếu dựa vào fallback JSON khi chạy với backend Vercel.

### ASP.NET Core

Backend .NET có cấu trúc gần với Clean Architecture:

```text
OpmWiki.Api
    ↓
OpmWiki.Application
    ↑
OpmWiki.Infrastructure
    ↓
OpmWiki.Domain
```

- `Domain`: entity và quy tắc dữ liệu cốt lõi.
- `Application`: DTO, abstraction/interface.
- `Infrastructure`: EF Core DbContext, repository, migration và seeder.
- `Api`: controller, xác thực, phân quyền, Swagger và tích hợp AI.

Ranh giới tầng chưa hoàn toàn thuần Clean Architecture: một phần nghiệp vụ vẫn nằm trong controller và repository, chưa được tách thành use case/application service độc lập.

### Điểm khởi chạy

- Frontend: `src/main.js`.
- Vercel API: `api/index.js`.
- SePay webhook: `api/sepay-webhook.js`.
- ASP.NET Core API: `backend/src/OpmWiki.Api/Program.cs`.

## 4. Cấu trúc thư mục quan trọng

| Đường dẫn | Vai trò |
|---|---|
| `src/` | Toàn bộ mã nguồn Vue SPA. |
| `src/views/` | Các trang public, account, forum, advisor, staff và admin. |
| `src/components/` | Component giao diện dùng lại. |
| `src/services/` | API client, auth, admin, community và các data service. |
| `src/router/` | Route và route guard theo trạng thái đăng nhập/vai trò. |
| `src/data/` | Dữ liệu JavaScript/JSON được bundle cùng frontend. |
| `src/locales/` | Nội dung dịch Việt/Anh. |
| `public/` | Asset tĩnh và dữ liệu JSON fallback/seed. |
| `api/` | Vercel Functions, route handler, database helper và webhook. |
| `backend/src/` | Các project Domain, Application, Infrastructure và Api của .NET. |
| `backend/tests/` | Unit/integration test cho backend .NET. |
| `backend/scripts/` | Script hỗ trợ backend/database. |
| `tests/` | Test Node, PGlite và Playwright. |
| `scripts/` | Script tiện ích dữ liệu/build ở cấp repository. |
| `dist/`, `build/`, `test-results/` | Output sinh tự động; không dùng làm nguồn sự thật. |
| `.vercel/` | Metadata cục bộ của Vercel; không đưa thông tin nhạy cảm vào tài liệu hoặc commit. |

Các thư mục `node_modules`, `dist`, `build`, `.git`, IDE metadata, cache, log và output sinh tự động không nên được phân tích hoặc chỉnh sửa trực tiếp khi phát triển tính năng.

## 5. Chức năng đã hoàn thành

### Khách chưa đăng nhập

- Trang chủ và điều hướng wiki.
- Danh sách/chi tiết nhân vật, kỹ năng và hiệu ứng.
- Mastery và Core Lab.
- Keepsake, Insignia và hướng dẫn Insignia.
- Backgear, Backgear set.
- Tactics cards/frames.
- Medals.
- Danh sách/chi tiết sự kiện.
- Lịch phát hành.
- Trang lịch sử và chính sách riêng tư.
- Giao diện đăng nhập/đăng ký.
- Menu mobile có điều hướng tới Core Lab và Huy chương, đồng bộ với tập route public hiện có.

### User

- Đăng ký, đăng nhập và xem/cập nhật khu vực tài khoản.
- Bình luận sự kiện.
- Tạo chủ đề và bài viết forum.
- Sử dụng Advisor.
- Tạo yêu cầu nạp bằng coupon.
- Tạo giao dịch chuyển khoản ngân hàng, nhận mã thanh toán/VietQR và theo dõi trạng thái.

### Staff

- Các quyền cộng đồng như User.
- Kiểm duyệt bình luận sự kiện.
- Kiểm duyệt chủ đề/bài viết forum.
- Không được duyệt giao dịch thanh toán.

### Admin

- Dashboard và thống kê.
- Quản lý vai trò/trạng thái tài khoản.
- CRUD characters, keepsakes, events và release schedule.
- API backend có khả năng liệt kê/duyệt yêu cầu coupon, nhưng frontend tương ứng chưa hoàn thiện.

### Thanh toán chuyển khoản

- Sinh mã tham chiếu dạng `OPM` kèm chuỗi hex.
- Sinh liên kết VietQR.
- Giao dịch có thời hạn khoảng 5 phút.
- Webhook SePay kiểm tra HMAC và giới hạn timestamp khoảng 5 phút.
- Cập nhật số dư, payment transaction và balance ledger trong một luồng SQL có cơ chế idempotency.
- Có unique constraint/index nhằm tránh cộng tiền hai lần cho cùng top-up hoặc payment.

## 6. Chức năng chưa hoàn thành hoặc chưa đồng nhất

- Chưa có frontend service/UI hoàn chỉnh để Admin liệt kê và duyệt top-up loại `Coupon`, dù backend đã có endpoint liên quan.
- Vercel backend chưa có API database cho Mastery, Keepsake, Insignia, Backgear và Tactics; frontend phải dùng JSON fallback.
- Advisor trên ASP.NET có thể gọi OpenAI-compatible API, còn Vercel Advisor chỉ dùng cơ chế wiki/keyword cục bộ. Chưa có parity giữa hai backend.
- `TODO.md` còn ghi nhu cầu hoàn thiện bản địa hóa và hướng dẫn người mới 10 ngày.
- Một số mục trong `TODO.md` đã cũ vì Keepsake/Insignia đã có code; cần đối chiếu code trước khi dùng TODO làm nguồn sự thật.
- Chưa có CI được xác minh trong repository.
- Chưa có lint/typecheck/format workflow thống nhất được xác minh.
- Trạng thái deploy production, WAF/rate limit của nền tảng và biến môi trường thực tế **chưa xác minh**.

## 7. Database và quan hệ dữ liệu

### Schema EF Core

`OpmWikiDbContext` hiện quản lý 20 bảng:

1. `characters`
2. `character_skills`
3. `character_effects`
4. `events`
5. `mastery_tiers`
6. `insignias`
7. `insignia_guides`
8. `insignia_guide_links`
9. `backgears`
10. `backgear_sets`
11. `tactic_cards`
12. `tactic_frames`
13. `user_accounts`
14. `event_comments`
15. `forum_topics`
16. `forum_posts`
17. `top_up_requests`
18. `payment_transactions`
19. `balance_ledger`
20. `release_schedule`

### Quan hệ chính

- `characters` 1-N `character_skills`; xóa character sẽ cascade.
- `characters` 1-N `character_effects`; xóa character sẽ cascade.
- `events` 1-N `event_comments` trong EF Core; xóa event sẽ cascade.
- `insignias` N-N `insignia_guides` qua `insignia_guide_links`.
- `user_accounts` 1-N `event_comments`, `forum_topics`, `forum_posts`, `top_up_requests`, `balance_ledger`; các quan hệ quan trọng dùng restrict để tránh mất lịch sử.
- `forum_topics` 1-N `forum_posts`; xóa topic sẽ cascade các post.
- `top_up_requests` có thể liên kết với `payment_transactions`.
- `balance_ledger` tham chiếu user, top-up và payment; unique key cho top-up/payment giúp chống ghi nhận số dư trùng.
- `top_up_requests.ReviewedBy` là quan hệ tùy chọn đến `user_accounts`.
- `mastery_tiers` dùng composite key `(Category, Tier)`.
- `release_schedule.CharacterId` không phải foreign key để vẫn biểu diễn được nhân vật chưa có trong bảng `characters`.

Một số trường danh sách dùng PostgreSQL `text[]`; dữ liệu lồng nhau/phức tạp dùng `jsonb`. Tên bảng dùng snake_case, trong khi nhiều cột PostgreSQL được quote theo PascalCase.

### Migration và seed

- Backend .NET có 8 nhóm migration chính: initial schema, mastery, insignia, backgear, tactics, community, release schedule và SePay/balance ledger.
- `JsonDataSeeder` đọc dữ liệu characters Việt/Anh, events, mastery, insignias, backgear và tactics.
- Seeder có tính chất upsert nhưng cũng xóa record không còn trong nguồn JSON và có thể ghi đè dữ liệu đã chỉnh qua Admin. Không chạy seed trên database đang vận hành nếu chưa chủ động chọn JSON làm nguồn sự thật.
- Release schedule được seed trong EF migration.
- Vercel Functions tự tạo khoảng 12 bảng phục vụ community và một phần content, đồng thời chỉ import characters/events khi bảng trống và có release seed riêng.

### Sai khác cần lưu ý

- EF Core có 20 bảng, còn schema runtime của Vercel chỉ bao phủ khoảng 12 bảng.
- Vercel `event_comments.EventId` không có foreign key đến `events` và endpoint tạo bình luận chưa xác minh event tồn tại, khác với mô hình EF.
- Schema Vercel được tạo lúc runtime thay vì migration có version; tài khoản database vì vậy phải có quyền DDL.
- Cần xem hai backend là hai implementation chưa hoàn toàn tương đương, không mặc định thay đổi một bên sẽ tự động áp dụng cho bên còn lại.

## 8. Xác thực, phân quyền và phiên đăng nhập

- JWT Bearer được dùng cho API bảo vệ.
- Client lưu JWT trong `sessionStorage`.
- Route guard phía Vue phục vụ trải nghiệm người dùng, không thay thế kiểm tra quyền ở server.
- Vai trò chính: `User`, `Staff`, `Admin`.
- Staff được kiểm duyệt community nhưng không được duyệt thanh toán.
- Endpoint lịch sử dành cho Staff liên quan top-up hiện được bảo vệ ở mức Admin.
- Mật khẩu dùng định dạng PBKDF2 tương thích giữa implementation Node và .NET.
- JWT issuer/audience được thiết kế tương thích giữa hai backend.
- Token hiện không có refresh/revocation flow được xác minh; role và trạng thái active trong claim có thể cũ cho đến khi token hết hạn, mặc định khoảng 60 phút.
- Có cơ chế tài khoản Admin từ biến môi trường ngoài tài khoản lưu trong database.

## 9. Quy tắc viết code đang được sử dụng

Đây là các quy ước quan sát được từ code, không phải toàn bộ đều được enforce tự động:

- JavaScript/Vue dùng ES modules, thường dùng dấu nháy đơn và phần lớn không dùng semicolon.
- Component Vue dùng Composition API và `<script setup>`.
- Route view được lazy-load, trừ một số màn hình lõi như Home.
- Logic gọi API đặt trong `src/services/`; không nên thêm request rải rác trực tiếp trong view nếu đã có service phù hợp.
- Dùng alias `@` trỏ đến `src`.
- Dữ liệu song ngữ dùng cặp trường như `NameVi`/`NameEn`; API public nhận `language=vi|en`.
- ID dữ liệu cần ổn định giữa bản Việt, bản Anh, JSON seed và database.
- Public GET có cache; sau Admin mutation phải invalidate cache liên quan.
- Mọi protected write phải gửi Bearer token và được kiểm tra quyền ở backend.
- Backend .NET dùng async/await, `CancellationToken`, nullable reference types, DI, DTO và EF Fluent configuration.
- Dữ liệu tĩnh JSON là nguồn seed đồng thời là fallback offline; chỉnh schema phải xét cả API, seeder và frontend fallback.
- Không sửa migration/designer sinh tự động bằng tay trừ khi hiểu rõ tác động; ưu tiên tạo migration mới.
- Không chạy seeder trên database có dữ liệu vận hành nếu chưa chấp nhận việc JSON có thể ghi đè/xóa dữ liệu.
- Asset path có ký tự `+` hoặc `#` phải được encode đúng. Đường dẫn keepsake trong Admin tránh ký tự `+`, dùng convention như `SSRplus`/`URplus`.
- Không đưa secret vào biến `VITE_*`, vì các biến này được bundle vào frontend.
- Không đọc, hiển thị hoặc commit giá trị secret trong `.env`, token, mật khẩu database, JWT secret, bank secret hoặc webhook secret.
- Trước khi sửa code phải chạy `git status`.
- Không ghi đè file `modified`, `deleted` hoặc `untracked` của người dùng.
- Không tự động chạy `git restore`, `git clean`, `git reset --hard` hoặc xóa file untracked.
- Nếu code đang tham chiếu một asset bị xóa, phải báo rõ tác động và hỏi mục đích của người dùng trước khi sửa hoặc khôi phục.
- Chưa có cấu hình lint/formatter bắt buộc được xác minh; khi sửa code nên giữ style của file hiện tại.

## 10. Cài đặt và chạy dự án

### Yêu cầu

- Node.js `>=18` theo README; phiên bản chính xác được CI/production dùng **chưa xác minh**.
- npm.
- .NET SDK 10 nếu chạy backend ASP.NET.
- Docker Desktop nếu dùng PostgreSQL/Docker Compose.

### Chạy frontend

```powershell
npm install
npm run dev
```

Frontend mặc định chạy tại `http://localhost:5173`.

Build và preview:

```powershell
npm run build
npm run preview
```

### Chạy toàn bộ backend .NET bằng Docker Compose

Từ thư mục gốc:

```powershell
Copy-Item backend/.env.example backend/.env
docker compose -f backend/docker-compose.yml up --build
```

API mặc định được tài liệu hóa tại `http://localhost:5180`; PostgreSQL tại port `5432`.

Trước khi chạy, phải thay toàn bộ giá trị placeholder trong `.env`, đặc biệt là database password, JWT key và thông tin Admin. Không dùng secret production cho môi trường local.

### Chạy backend .NET thủ công

```powershell
Set-Location backend
Copy-Item .env.example .env
docker compose up -d database
dotnet tool restore
dotnet ef database update --project src/OpmWiki.Infrastructure --startup-project src/OpmWiki.Api
dotnet run --project src/OpmWiki.Api -- --seed-data
dotnet run --project src/OpmWiki.Api --urls http://localhost:5180
```

Swagger: `http://localhost:5180/swagger`.

Lệnh `--seed-data` có thể đồng bộ/xóa theo JSON; chỉ dùng khi đó là chủ đích.

### Cấu hình frontend gọi backend

- Local mặc định: `http://localhost:5180`.
- Có thể đặt `VITE_API_BASE_URL`.
- Production không đặt biến này sẽ dùng API cùng origin, phù hợp với Vercel Functions.

### Chạy test

```powershell
npm test
npm run test:integration
dotnet test backend/OpmWiki.sln
```

Production smoke test Admin CRUD:

```powershell
npm run test:production:admin-crud
```

Smoke test production cần credential hợp lệ và có thao tác tạo/sửa/xóa rồi hoàn tác dữ liệu. Chỉ chạy khi đã xác nhận đúng môi trường và được phép thay đổi dữ liệu.

### Deploy

- Vercel build SPA bằng Vite và route `/api/*` tới Functions trong `api/`.
- Node Functions kết nối PostgreSQL bằng `DATABASE_URL`.
- `api/sepay-webhook.js` cần raw body và secret phía server.
- Root `Dockerfile` build backend ASP.NET thành container không chạy bằng root, lắng nghe port nội bộ `8080`.
- Cấu hình production thực tế, biến môi trường đang hoạt động và phiên bản đã deploy **chưa xác minh**.

## 11. Lỗi và rủi ro đã phát hiện

### Mức ưu tiên cao

1. **Secret cục bộ:** các file `.env.local`/`.env.production.local` bị ignore có chứa credential/token thực. Không sao chép chúng vào issue, log, tài liệu hoặc commit. Token quan sát được đã hết hạn tại thời điểm kiểm tra, nhưng vẫn nên xoay vòng/xóa credential không còn dùng.
2. **Rate limiting:** Vercel API chưa có rate limit ở tầng ứng dụng; khả năng bảo vệ của WAF/platform **chưa xác minh**. Backend .NET mới thấy giới hạn login theo IP.
3. **Nguy cơ XSS:** `DetailView.vue` dựng nội dung kỹ năng bằng `v-html` và inline JavaScript; một số giá trị chưa được escape/sanitize đầy đủ. Core Lab cũng hiển thị HTML động. Dữ liệu hiện chủ yếu là trusted seed/Admin, nhưng đây vẫn là bề mặt XSS.
4. **Hai backend bị lệch:** schema, endpoint và nghiệp vụ Node/.NET không tương đương. Thay đổi một backend có thể không hoạt động trên backend còn lại.
5. **Schema runtime:** Vercel thực thi DDL khi runtime, không có migration versioned đầy đủ; khó audit/rollback và đòi hỏi database credential có quyền tạo/sửa schema.
6. **Thiếu UI duyệt coupon:** backend có endpoint nhưng Admin frontend chưa hoàn chỉnh, khiến quy trình coupon chưa khép kín.

### Mức ưu tiên trung bình

7. JWT lưu trong `sessionStorage`, không có refresh/revocation được xác minh; quyền/trạng thái bị khóa trong claim đến khi token hết hạn.
8. Public response có CDN cache dài hơn cache client; Admin chỉ invalidate cache trong client, không purge CDN.
9. Release schedule đang bị lặp ở nhiều nguồn: JSON frontend, HomeView, Vercel seed và EF migration.
10. Một số file quá lớn và gộp nhiều trách nhiệm, gồm Medals, Tactics, Detail và `adminRoutes`.
11. `HomeView` có block chết dùng `v-if="false"`.
12. README/CHANGELOG/TODO có chỗ chậm hơn code; CHANGELOG chưa phản ánh đầy đủ luồng nạp ngân hàng mới.
13. Chưa có CSP/security header ở tầng ứng dụng được xác minh; HSTS cho production .NET cũng chưa được xác minh.
14. Chưa thấy CI, lint, typecheck hoặc Node version pin.
15. Thư mục `public` rất lớn, xấp xỉ 981 MB, làm tăng thời gian clone/build/deploy và chi phí truyền tải.
16. Dependency `sharp` có dấu hiệu chưa dùng.

## 12. Các quyết định kỹ thuật quan trọng

- Production ưu tiên mô hình Vercel SPA + same-origin Functions; ASP.NET Core là backend đầy đủ hơn và có thể chạy/deploy độc lập.
- PostgreSQL/Neon là database chính.
- Static JSON vừa là nguồn seed vừa là fallback để wiki public vẫn đọc được khi API thiếu hoặc lỗi.
- Dữ liệu song ngữ được lưu thành các cột riêng và chọn ngôn ngữ qua request, thay vì dùng một bảng translation riêng.
- Keepsake là dữ liệu gắn với character, không tạo bảng keepsake độc lập trong EF.
- Community, tài khoản, số dư và thanh toán chỉ dựa vào database; không có JSON fallback.
- JWT được lưu theo phiên browser; authorization thật phải được enforce phía server.
- PBKDF2 và cấu hình JWT được giữ tương thích giữa Node và .NET.
- Thông tin ngân hàng và secret webhook chỉ ở server; client nhận payload công khai cần thiết để hiển thị VietQR.
- Webhook thanh toán dùng raw-body HMAC, timestamp window, transaction/CTE và ledger unique key để chống cộng tiền lặp.
- Staff không được duyệt thanh toán; quyền này thuộc Admin.
- Release schedule không bắt buộc foreign key đến character để hỗ trợ dữ liệu nhân vật chưa phát hành/chưa nhập.
- Public API sử dụng cache; Admin mutation cần làm mới dữ liệu liên quan.
- Route view được lazy-load để giảm bundle ban đầu.

## 13. Danh sách việc cần làm tiếp theo

### Cần xử lý ngay

1. Xoay vòng và dọn các credential/token cục bộ không còn cần thiết; kiểm tra chắc chắn không có secret trong Git history.
2. Vá các điểm dùng `v-html`/inline JavaScript bằng sanitizer hoặc render có cấu trúc, đồng thời bổ sung CSP phù hợp.
3. Thêm rate limit cho auth, community, advisor và payment/webhook endpoint; xác minh WAF/rate limit ở production.
4. Chọn chiến lược chính thức cho Node Functions và ASP.NET Core, sau đó lập ma trận parity endpoint/schema trước khi phát triển tiếp.
5. Chuyển schema Vercel sang migration có version và thu hẹp quyền của database runtime.
6. Hoàn thiện UI/service Admin cho danh sách và duyệt coupon top-up.

### Nên cải thiện

7. Xây dựng CI chạy build, Node tests, .NET tests và các kiểm tra migration.
8. Thêm ESLint/formatter/typecheck hoặc quy tắc tương đương; pin Node bằng `engines` và file version.
9. Hợp nhất release schedule về một nguồn sự thật.
10. Bổ sung cơ chế token refresh/revocation hoặc kiểm tra trạng thái account ở request nhạy cảm.
11. Đồng bộ tài liệu, CHANGELOG và TODO với code hiện tại.
12. Tách các view/route handler lớn thành module nhỏ hơn.
13. Bổ sung foreign key/validation event cho comment ở schema Vercel.
14. Xác minh và cấu hình security headers/HSTS cho cả hai kiểu deploy.

### Có thể phát triển sau

15. Hoàn thiện bản địa hóa và hướng dẫn người mới 10 ngày.
16. Cân nhắc đưa asset lớn sang object storage/CDN và tối ưu định dạng/kích thước.
17. Bổ sung API database cho Mastery, Insignia, Backgear và Tactics trên backend production đã chọn.
18. Quyết định trải nghiệm Advisor thống nhất: AI bên ngoài hoặc wiki engine cục bộ.
19. Loại bỏ dependency/code chết sau khi xác nhận không còn consumer.

## 14. Các file quan trọng cần đọc trước khi sửa code

### Tổng quan và cấu hình

- `README.md` — mục tiêu, tính năng và lệnh khởi động tổng quát.
- `CHANGELOG.md` — lịch sử thay đổi đã ghi nhận; cần đối chiếu commit gần đây.
- `TODO.md` — backlog cũ; không xem là nguồn sự thật nếu mâu thuẫn với code.
- `package.json` — dependency và npm scripts.
- `vite.config.js` — cấu hình Vite và alias.
- `vercel.json` — build, rewrite và cấu hình Vercel.
- `.env.example` — danh sách biến môi trường, không chứa giá trị thật.
- `Dockerfile` — image production cho backend .NET.
- `backend/docker-compose.yml` — PostgreSQL và API local.
- `backend/README.md` — hướng dẫn backend.
- `backend/DEPLOYMENT.md` — hướng dẫn deploy backend .NET.

### Frontend

- `src/main.js` — bootstrap Vue.
- `src/App.vue` — application shell.
- `src/router/index.js` — route, lazy loading và role guard.
- `src/services/apiClient.js` — base URL, timeout, auth header và cache.
- `src/services/authApi.js` — đăng nhập, token và session.
- `src/services/adminApi.js` — API quản trị.
- `src/services/communityApi.js` — bình luận, forum, advisor và top-up.
- `src/services/characterApi.js` — character API và fallback.
- `src/services/eventApi.js` — event API và fallback.
- `src/services/releaseScheduleApi.js` — release schedule API và fallback.
- `src/views/DetailView.vue` — chi tiết nhân vật và điểm cần kiểm tra XSS.
- `src/views/CoreLabView.vue` — Core Lab và HTML động.
- `src/views/TopUpHubView.vue` — điểm vào lựa chọn phương thức nạp tiền tại `/top-up`.
- `src/views/TopUpView.vue` — component tạo yêu cầu nạp ngân hàng, vẫn được `TopUpHubView.vue` import và sử dụng.
- `src/views/BankPaymentView.vue` — hiển thị VietQR và theo dõi trạng thái thanh toán chuyển khoản.
- `src/views/AdminDashboardView.vue` — dashboard Admin.
- `src/views/StaffDashboardView.vue` — moderation Staff.

### Vercel Functions

- `api/index.js` — entry point và route dispatch.
- `api/sepay-webhook.js` — raw-body webhook entry point.
- `api/_lib/database.js` — kết nối/schema community.
- `api/_lib/adminDatabase.js` — schema/content seed và Admin queries.
- `api/_lib/security.js` — password/JWT/security helper.
- `api/_lib/authRoutes.js` — auth endpoints.
- `api/_lib/communityRoutes.js` — comment, forum, advisor và top-up endpoints.
- `api/_lib/adminRoutes.js` — Admin CRUD và quản lý account.
- `api/_lib/sepayWebhook.js` — xác minh và xử lý giao dịch ngân hàng.

### ASP.NET Core

- `backend/src/OpmWiki.Api/Program.cs` — composition root, middleware, auth, DI và seed.
- `backend/src/OpmWiki.Api/Controllers/` — API surface và authorization.
- `backend/src/OpmWiki.Application/` — DTO và interface.
- `backend/src/OpmWiki.Domain/Entities/` — mô hình domain.
- `backend/src/OpmWiki.Infrastructure/Persistence/OpmWikiDbContext.cs` — schema và quan hệ EF.
- `backend/src/OpmWiki.Infrastructure/Repositories/CommunityRepository.cs` — community/payment logic.
- `backend/src/OpmWiki.Infrastructure/Repositories/AdminCharacterRepository.cs` — Admin character/keepsake logic.
- `backend/src/OpmWiki.Infrastructure/Seeding/JsonDataSeeder.cs` — seed/upsert/delete từ JSON.
- `backend/src/OpmWiki.Infrastructure/Migrations/` — lịch sử schema.

### Test

- `playwright.config.js` — cấu hình E2E.
- `tests/` — Node/PGlite/Playwright tests.
- `backend/tests/` — xUnit và integration tests .NET.

Trước khi sửa một chức năng, cần đọc cả frontend service/view và implementation tương ứng ở `api/` lẫn `backend/` để tránh làm tăng độ lệch giữa hai backend.

## Tóm tắt ngữ cảnh để tiếp tục làm việc

OPM Strongest Wiki là Vue 3 SPA song ngữ cho dữ liệu game và cộng đồng. Production được thiết kế chủ yếu theo Vercel Functions + Neon, trong khi repository còn có backend ASP.NET Core/.NET 10 đầy đủ hơn theo kiến trúc gần Clean Architecture. Frontend dùng service layer, JWT trong `sessionStorage`, route guard theo `User`/`Staff`/`Admin`, và JSON làm seed/fallback cho dữ liệu wiki. Database EF có 20 bảng; schema Vercel chỉ bao phủ khoảng 12 bảng và đang tạo bằng DDL runtime, vì vậy hai backend có sai khác đáng kể. Luồng chuyển khoản dùng VietQR, SePay HMAC và balance ledger idempotent. Các ưu tiên lớn nhất là bảo vệ secret, xử lý XSS, thêm rate limit, version hóa migration Vercel, xác định chiến lược/parity hai backend và hoàn thiện UI duyệt coupon. Trước mọi thay đổi, đọc `src/router/index.js`, service/view liên quan, `api/index.js` cùng handler Node tương ứng, `backend/src/OpmWiki.Api/Program.cs`, `OpmWikiDbContext.cs`, migration và test liên quan; không chạy seeder trên dữ liệu vận hành nếu chưa chủ động chọn JSON làm nguồn sự thật.
