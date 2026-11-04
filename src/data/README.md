# Thư mục Dữ Liệu Tĩnh (`/src/data`)

## Việt hóa nhân vật

- `characters.json` và `characters_en.json` phải giữ cùng tập ID ổn định để đối chiếu hai ngôn ngữ (candidate hiện có 179 ID).
- Nguồn chốt cho 318 hiệu ứng và 178 tên nhân vật nằm tại `docs/VIET_HOA_HIEU_UNG_VA_TEN_NHAN_VAT_HOAN_CHINH.md`.
- `characterNameAliases.js` lưu tên tiếng Anh/tên seed cũ theo ID. Frontend dùng file này để nhận biết tên cũ từ API nhưng vẫn giữ nguyên tên tùy chỉnh do Admin nhập.
- Không sửa thứ tự hoặc ID nhân vật chỉ để đổi bản dịch. Sau khi cập nhật phải chạy `npm.cmd run test:frontend`.

Thư mục này chứa toàn bộ dữ liệu cấu trúc dưới dạng JSON, hoạt động như cơ sở dữ liệu chính cho ứng dụng.

## Chi tiết các tệp JSON
1.  **`characters.json` (Tiếng Việt) & `characters_en.json` (Tiếng Anh)**:
    *   **Nhiệm vụ**: Chứa toàn bộ thông tin chỉ số, phe phái, hệ, ngày ra mắt, kỷ vật và chi tiết các kỹ năng của tất cả nhân vật trong game từ bậc N đến UR+.
    *   **Cấu trúc chính**:
        *   `id`: Mã định danh duy nhất (VD: `"108"` cho Bomb).
        *   `name`: Tên nhân vật.
        *   `tier`: Bậc nhân vật (`SSR+`, `UR`, `UR+`...).
        *   `faction`: Phe (`Hero`, `Monster`, `Martial Artist`, `Outlaw`, `Other`).
        *   `type`: Hệ (`Grappler`, `Hi-Tech`, `Duelist`, `Esper`).
        *   `stats`: Các chỉ số cơ bản (HP, ATK, DEF, SPD).
        *   `skills`: Mảng chứa thông tin kỹ năng gồm:
            *   `name`: Tên kỹ năng.
            *   `type`: Loại kỹ năng (`basic`, `ult`, `passive`, `awaken`).
            *   `desc`: Mô tả chi tiết kỹ năng (hỗ trợ định dạng HTML/CSS để bôi màu chữ).
            *   `videoURL` / `animationURL`: Hoạt ảnh kỹ năng dạng video hoặc gif.
2.  **`coreLab.json`**:
    *   **Nhiệm vụ**: Chứa dữ liệu logic cho phân hệ Phòng Thí Nghiệm Cốt Lõi (Core Lab).
    *   **Cấu trúc chính**:
        *   `heroes`: Mảng các tướng có Core Skill. Mỗi tướng chứa:
            *   `coreHeId`: ID liên kết đến Core Lab.
            *   `coreName`: Tên kỹ năng Core.
            *   `levels`: Danh sách mốc nâng cấp từ lv 1 đến lv 17, bao gồm chi tiết tài nguyên tiêu hao (`cost`), hiệu quả sơ cấp (`coreEffect`), hiệu quả cao cấp (`reward`), điều kiện kích hoạt (`condition`), và biểu tượng mốc nâng cấp (`milestoneIcon`).
3.  **`events.json`**:
    *   **Nhiệm vụ**: Quản lý lịch trình sự kiện trong tháng (Banner chiêu mộ, Sự kiện huấn luyện, Quà nạp mốc).
4.  **`releaseSchedule.json`**:
    *   **Nhiệm vụ**: Dữ liệu dự phòng song ngữ cho lịch ra mắt CN/SEA khi API Neon không khả dụng.
5.  **`backgear.json`**:
    *   **Nhiệm vụ**: Chứa tên song ngữ, nguồn nhận, ảnh, chỉ số theo cấp, chi phí nâng và dữ liệu Bộ Sưu Tập Thẻ Hình nền.
6.  **`insignias.json`**:
    *   **Nhiệm vụ**: Chứa đúng 10 Huy Hiệu hợp lệ, nội dung song ngữ và quan hệ tới các hướng dẫn nhận dùng chung. Đây là nguồn seed cho PostgreSQL và dữ liệu dự phòng của frontend.
7.  **`tactics.json`**:
    *   **Nhiệm vụ**: Chứa 19 Thẻ Chiến thuật, chỉ số theo phẩm chất/sao và 13 Khung Chiến thuật. Đây là nguồn seed PostgreSQL và fallback của trang Chiến thuật.

## Quy tắc canonical đọc và nhập kỹ năng nhân vật

Đọc toàn bộ tài liệu này trước mỗi lần thêm, sửa hoặc import nhân vật. Các quy tắc
dưới đây dùng lại cho mọi nhân vật; ví dụ Đồng Đế UR+ không phải mặc định áp dụng
cho nhân vật khác. Giữ tên hiệu ứng VI/EN theo tài liệu Việt hóa đã chốt ở trên.
Ngoặc chứa tên hiệu ứng như `[Tái Chiến]` khác với ngoặc chứa giá trị số nâng cấp.

### 1. Đọc từng chuỗi giá trị trong ngoặc

- `X [Y]`: X là cơ bản, Y là nâng cấp. `X [Y] [Z]`: X là cơ bản, Y là nâng cấp
  thứ nhất, Z là nâng cấp thứ hai, cho đúng hiệu ứng trên chính dòng nguồn đó.
- Ví dụ `5000% [7000%]` là 5000% cơ bản và 7000% nâng cấp; chưa tự chứng minh
  đó là Tuyệt kỹ/Siêu tuyệt kỹ. Không suy ra sao, cấp thức tỉnh hoặc điều kiện
  mở khóa chỉ từ số lượng ngoặc.
- Phân biệt **tiến trình giá trị số** đã biết với **mapping mốc mở khóa** chưa
  xác minh. Có thể trình bày `X → Y → Z` cho đúng hiệu ứng mà không gán sao hoặc
  A1/A2/A3. Giữ nguyên giá trị và ký hiệu ngoặc trong dữ liệu nguồn; UI không chỉ
  để chuỗi ngoặc làm cách hiển thị nâng cấp duy nhất. Không ghép các chuỗi hiệu
  ứng có số mức khác nhau thành một mapping chung.
- Nếu nguồn chính thức chứng minh cách hiểu khác, báo sự khác biệt trước khi
  áp dụng. Lưu nguồn và xác nhận phân loại của owner nếu nguồn trình bày gộp.

### 2. Tách các hiệu ứng độc lập

Gắn mỗi giá trị với tên hiệu ứng, kỹ năng/trạng thái và nguồn riêng. Không trộn
sát thương, số lần Tái Chiến, Năng Lượng, miễn nhiễm và tiêu hao. `3 [4]` lần
Tái Chiến không phải `3 [4]` Năng Lượng; giảm lượt Tái Chiến không phải trừ Nộ;
miễn nhiễm Giảm Năng Lượng/Khóa Năng Lượng không chứng minh nhân vật mất 2 Nộ.

### 3. Tuyệt kỹ và Siêu tuyệt kỹ

Kiểm tra biến thể nhân vật và các nhân vật tham chiếu trước khi phân loại nâng
cấp. Chỉ khi owner hoặc nguồn xác nhận X là Tuyệt kỹ và Y là Siêu tuyệt kỹ,
tạo hai trạng thái/card bằng schema và renderer generic hiện có. Không gom mất
Siêu tuyệt kỹ; cũng không tự coi mọi giá trị trong ngoặc là Siêu tuyệt kỹ.
Giữ các hiệu ứng chung không đổi trừ khi có bằng chứng riêng cho khác biệt.

### 4. Nội tại thường

Với Đồng Đế UR+, owner đã xác nhận `80% [85%] [90%]`:

- 2★ thường: mở Nội tại, giá trị cơ bản 80%.
- 5★ vàng: nâng cấp cùng Nội tại lên 85%.
- 5★ tím: nâng cấp cùng Nội tại lên 90%.

Đây là một kỹ năng, ba trạng thái nâng cấp hiển thị qua ba card, badge sao và
icon generic như nhân vật tham chiếu. Không tạo ba kỹ năng không liên quan,
component progression riêng hoặc schema lồng riêng cho Child. Mapping của
nhân vật khác phải được xác minh riêng, không sao chép ví dụ này mặc định.

### 5. Nội tại thức tỉnh

Đọc từng dòng thức tỉnh độc lập với Nội tại thường. Đồng Đế UR+ có
`92% [95%] [98%]` Giảm Sát Thương Chuẩn và `3 [4]` Năng Lượng mỗi lượt.
Owner chốt bổ sung ngày 13/10/2026: dùng dữ liệu wiki cộng đồng được owner
chấp nhận tại `https://opm-ts-wiki.vercel.app/en/character-info/100320-urplus`,
mục Game data CN 5148: `sk_core016a1` = A1, 92%, 3 Năng Lượng;
`sk_core016a2` = A2, 95%, 3 Năng Lượng; `sk_core016a3` = A3, 98%, 4 Năng Lượng.
Theo mẫu generic hiện có của G5 UR+ và Vua Không Nhà UR+, trình bày ba
card/accordion nâng cấp A1/A2/A3 của cùng một Nội tại thức tỉnh, không tạo ba
kỹ năng nguồn hay ba nút ngang riêng. Mỗi card dùng nguyên layout, typography,
icon và hành vi collapse/scroll chung, hiển thị cả hai hiệu ứng theo cấp. Đây là
**owner-confirmed từ wiki cộng đồng**, không phải publisher-confirmed. Giữ
nguyên chuỗi nguồn; phần trăm tiến triển độc lập `92% → 95% → 98%`,
Năng Lượng tiến triển `3 → 4`; không bịa giá
trị thứ ba khác 3/3/4 đã được owner chấp nhận. Điều kiện mở khóa từng cấp vẫn
INCONCLUSIVE; không suy từ tên ID hoặc sao ở bảng nâng cấp khác. Metadata
trình bày chỉ kích hoạt khi chuỗi trên chính dòng nguồn và các giá trị mapping
khớp; không áp dụng sang nhân vật khác khi chưa có nhu cầu/bằng chứng. Không
tự gán A1/A2/A3 cho nhân vật khác chỉ vì có ba giá trị. Không tạo card A1/A2/A3
giả hoặc thêm điều kiện mở khóa chưa xác minh. Dữ liệu nguồn đã có
vẫn hiển thị; bỏ cơ
chế placeholder không có nguồn. Nếu một mô tả nguồn thực sự bị thiếu/thu gọn,
đánh dấu đúng phần thiếu là `Đang cập nhật` / `Updating`, không suy từ kỹ năng khác.

### 6. Đối chiếu convention trước khi thay schema/UI

Kiểm tra biến thể cùng nhân vật, nhân vật cùng độ hiếm, renderer generic,
icon, badge, sao/nâng cấp, thức tỉnh và hành vi collapse/scroll. Ví dụ tham chiếu
hiện có: Đồng Đế SSR/SSR+/UR, Homeless Emperor UR+, G5 UR+, Black Sperm UR+.
Chỉ thêm logic khi schema hiện tại thực sự không đáp ứng; không tạo nhánh theo
ID nếu dữ liệu chung biểu diễn được. `Class_SS` dùng nhãn SS và
`/Class/Class_SS.png` qua trình bày class chung, không dùng Mecha Overlord làm CẤP.

### 7. Đồng bộ lịch sử ở mọi lần cập nhật

Thực hiện mục đồng bộ lịch sử bên dưới cho mọi lần thêm/sửa/import, kể cả chỉ
sửa kỹ năng hoặc ảnh. Tìm theo ID ổn định, ghi nguồn đã kiểm tra, sự kiện có sẵn,
sự kiện thêm/sửa có bằng chứng, duplicate, VI/EN và Home/Detail. Không tạo lịch
phát hành chỉ vì nội dung website đổi; tách nhật ký biên tập khỏi lịch ingame.
Báo cáo bắt buộc `CHARACTER_HISTORY_SYNC=PASS/FAIL`.

### 8. Dữ liệu thiếu, mâu thuẫn và quyền xác nhận

Không đoán cơ chế, số liệu, điều kiện mở khóa hay mốc sao/thức tỉnh. Báo chính
xác phần chưa xác minh. Khi nguồn công khai gộp nhiều trạng thái, mapping được
owner xác nhận rõ được ưu tiên; ghi provenance, không gọi đó là kiểm chứng độc
lập của nhà phát hành. Mâu thuẫn mới với nguồn chính thức phải báo trước khi áp dụng.

#### Mapping Đồng Đế UR+ được owner chốt

ID `100320-urplus`, Đồng Đế / Child Emperor, UR+, CẤP SS. Nguồn tham khảo:
`https://opm-the-strongest.vercel.app/character-detail/40`; phân loại trạng thái
dưới đây do owner xác nhận, không suy chỉ từ ngoặc:

- Tuyệt kỹ / Ultimate: 5000% sát thương, giảm **3** lần Tái Chiến của toàn bộ kẻ địch.
- Siêu tuyệt kỹ / Super Ultimate: 7000% sát thương, giảm **4** lần Tái Chiến của toàn bộ kẻ địch.
- Các hiệu ứng chung còn lại giữ theo nguồn; Nội tại thường theo mục 4,
  Nội tại thức tỉnh giữ chuỗi riêng theo mục 5. `ENERGY_MINUS_2_VERIFIED=NO`: không thêm −2 Nộ.
- Lịch owner-confirmed, planned giữ nguyên: CN ra mắt 01/10/2026, trở lại
  15/12/2026; SEA ra mắt 01/02/2027, trở lại 15/04/2027. Không nâng trạng thái xác minh.

#### Kiểm tra trước khi bàn giao

Đối chiếu catalog VI/EN với public detail payload, tránh card/ID/event trùng,
bảo toàn các nhân vật không liên quan; chạy focused tests, `npm test`, Playwright
VI/EN desktop/mobile và nhân vật tham chiếu, production build và diff-check.
Nếu sửa payload public được cache, đổi revision đúng payload đã sửa, không đổi
cache key của nhân vật khác. Generator/importer không phải authority xác nhận
mapping; review diff sinh ra, không chạy bulk rewrite để thay dữ liệu chưa duyệt.
Không nới assertion để che lỗi; báo PASS/FAIL/SKIP riêng và không coi test local
là deploy hoặc kiểm chứng production.

## Bắt buộc đồng bộ lịch sử khi cập nhật nhân vật

### Đồng Đế UR+ — nguyên liệu Core đã đối chiếu (12/10/2026)

`coreMaterialCosts.json` bổ sung riêng số lượng nguyên liệu cho `100320-urplus` /
`he_100320`, không đổi hiệu ứng đã chốt trong `coreLab.json`. Nguồn:
https://opm-ts-wiki.vercel.app/vi/core-lab (đúng UR+, liên kết ID 100320-urplus).
20 tổng tích lũy Lv0→Lv1…20 được đọc từ UI nguồn: SOURCE_VERIFIED; mỗi bước là
hiệu hai tổng liên tiếp: DERIVED_VERIFIED. Không dùng công thức ước lượng.
Lv0→Lv0 không nâng cấp nên không trả phí; thiếu bước phải báo chưa đủ dữ liệu,
không cộng tổng giả. Owner đã cho phép dùng số lượng, chưa xác nhận 6 icon
Item_215091…215096 hoặc mapping 320_c1/c2/c3: giữ INCONCLUSIVE, không lấy ảnh
bên thứ ba/nhân vật khác. Nguồn tham khảo khác dữ liệu hiệu ứng Core hiện tại
(bao gồm tên Lv17); chờ owner đối chiếu, không tự sửa hiệu ứng/mốc thức tỉnh.
Kỷ vật owner cung cấp chỉ xác nhận icon và mở Siêu tuyệt kỹ, không xác nhận
tên/chỉ số riêng. Lịch vẫn giữ nguyên bốn mốc owner-confirmed/planned; chưa có
nguồn đầy đủ cho các sự kiện VN/SEA/CN khác tháng 10/2026: NEED_OWNER_SOURCE.

Every character addition or update must include a character-history synchronization check. Release events must be updated in the canonical history source whenever new verified release information is added or corrected. Do not invent events. Keep editorial change history separate from in-game release history.

- Tìm theo ID ổn định, không theo tên VI/EN. Kiểm tra `releaseSchedule.json` (lịch ISO CN/SEA), các trường ngày legacy trong catalog/detail VI/EN, `characterReleaseDates.js`, và luồng merge API/local trong `releaseScheduleApi.js`.
- Production API vẫn là nguồn lịch production; JSON là fallback và phần bổ sung frontend đã được owner duyệt. Detail dùng các sự kiện JSON cùng ID trước ngày suy diễn legacy. Không coi một thay đổi local là đã ghi database.
- Chỉ thêm/sửa sự kiện có nguồn hoặc owner phê duyệt. Sửa kỹ năng/ảnh không tạo sự kiện ingame mới. Không ép nhân vật có đủ CN/SEA khi chưa biết lịch. Nhật ký biên tập phải tách khỏi lịch phát hành.
- Schema sự kiện: `characterId`, `server` (CN/SEA), `date` (YYYY-MM-DD), `isReturn`, `sortOrder`, `bannerImage`. Metadata tùy chọn tương thích: `source: owner`, `verificationStatus: owner-confirmed`, `status: planned`; đây không phải xác nhận độc lập của nhà phát hành. Home hiện hỗ trợ ra mắt và trở lại; Detail dùng timeline chung. API cùng composite key không được tạo dòng bổ sung trùng.
- Kiểm tra ID, ngày hợp lệ, server, event/composite key trùng; đối chiếu các sự kiện có nguồn, VI/EN và Home/Detail. Chạy `tests/character-history.test.mjs`, các test Child/Home/locale và Playwright tương ứng.
- Mỗi báo cáo cập nhật nhân vật phải có `CHARACTER_HISTORY_SYNC=PASS/FAIL`, ID, file nguồn đã kiểm tra, event thêm/sửa/giữ nguyên, lý do không đổi lịch nếu chỉ sửa nội dung, duplicate count và kết quả Home/Detail.

### Lịch chỉ xác nhận tháng — owner 04/11/2026

Gale/Hellfire100321-urplus: CN2026-11, SEA2027-03. Canonical releaseSchedule.json ghi date:null, yearMonth:YYYY-MM, datePrecision:month, source:owner. Không đổi thành ngày01 hoặc suy ngày tái xuất. Detail hiển thị MM/YYYY; daily Home schedule và hero preload bỏ qua record month-only cho tới khi có ngày chính xác. Basic owner-confirmed: Gale3hit, Child2hit, cùng một mục tiêu và120%ATK; không thêm flat damage hoặc hiệu ứng.

Owner bổ sung cùng ngày: mỗi server trở lại sau2tháng, CN2027-01 vàSEA2027-05; giữ datePrecision:month, không suy ngày.

### Owner sửa ngày cụ thể —04/11/2026

Thay thế lịch chỉ-tháng trước: Gale/Hellfire CN01/11/2026→15/01/2027; SEA15/03/2027→15/05/2027. Đồng Đế giữ ngày ra mắt CN01/10/2026, SEA01/02/2027; trở lại CN15/12/2026, SEA15/04/2027. Canonical history, catalog và payload VI/EN đồng bộ; Home tháng10/11 dùng các ngày này. Đây là owner-confirmed, không phải xác nhận độc lập của nhà phát hành.

### Home đồng bộ lịch sử CN/SEA tháng10–11 —04/11/2026

Theo yêu cầu owner, thêm5mốc đang hiển thị trong Detail: CN Tinh Trùng Đen trở lại15/10; SEA Rover ra mắt01/10, G5 trở lại15/10, Zombieman ra mắt01/11, Bang/Bomb trở lại15/11. Nguồn là catalog/payloadVI/EN và helper lịch sử hiện có; các ngày trở lại này là convention local15ngày,+2tháng, không phải nguồn game độc lập. Gắn source:character-history, verificationStatus:existing-local-history, status:planned; không gọi chúng publisher-verified. Giữ nguyên toàn bộ27event trước, kể cả Vua Không Nhà trở lại01/11 theo canonical hiện có; không tự sửa thành15/11. Toàn bộ180Detail history và dữ liệu nhân vật giữ nguyên.

### Owner sửa lịch trở lại Vua Không Nhà —04/11/2026

Thay thế mốc canonical cũ: CN trở lại15/11/2026; SEA trở lại15/03/2027 theo yêu cầu sửa cùng ngày15. Giữ nguyên ra mắtCN01/09/2026 vàSEA01/01/2027. Nguồn là quyết định owner (SEA theo ngữ cảnh cùng quy tắc), không phải kiểm chứng publisher. Hai event cósortOrder không trùng với Gale để Home không mất hoặc nhân đôi banner; tháng11 hiển thịra mắt trước rồi trở lại. Không thaycatalog/payload, vì Detail lấyreturntừ canonical theoID; không thay Basic/gameplay/Core/ảnh.
