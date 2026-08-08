# Bảng Việt hóa hiệu ứng và tên nhân vật

> **Trạng thái triển khai — 04/08/2026**
>
> - Đây là bảng chốt chuẩn đang được dùng để kiểm tra dữ liệu Việt hóa.
> - Đã áp dụng đủ **318 thuật ngữ/hiệu ứng** và **177 tên nhân vật** vào `src/data/characters.json`.
> - Website không đọc Markdown này ở runtime; test tự động dùng bảng để phát hiện bản dịch thiếu hoặc bị lệch.
> - Tìm kiếm nhân vật hỗ trợ tên Việt, tên Anh, tên cũ, ID và tiếng Việt không dấu ở cả hai giao diện VI/EN.
> - Lần xác minh gần nhất: `npm.cmd test` đạt **46/46**, `npm.cmd run build` thành công.

File này là phiếu biên tập. Chưa được đọc tự động bởi website. Bạn sửa trực tiếp cột **Tên Việt bạn chốt**, sau đó báo Codex để áp dụng vào dữ liệu Việt.

## Cách sửa

- Không sửa cột `Thuật ngữ EN nguồn`, `ID` hoặc `Tên EN hiện tại`.
- Điền bản dịch vào cột `Tên Việt bạn chốt`.
- Đánh dấu `[x]` ở cột `Đã chốt` khi đã quyết định xong.
- Nếu muốn giữ nguyên tên tiếng Anh, hãy chép nguyên tên đó vào cột Việt.
- Ví dụ: `Specialized Direct DMG` → `Sát Thương Trực Tiếp Chuyên Biệt`.

## 1. Thuật ngữ và hiệu ứng (318 mục)

| STT | Đã chốt | Thuật ngữ EN nguồn | Tên Việt bạn chốt | Nhân vật đang sử dụng |
|---:|:---:|---|---|---|
| 1 | [x] | `Absolute Stun` | `Choáng Tuyệt Đối` | Garou (100094-ur), Subterranean King (100017-ur) |
| 2 | [x] | `Adhere` | `Bám Dính` | Deep Sea King (100003-ssrplus), Groribas (100062-ssrplus), King (100187-ur), Tank Top Master (100028-ssrplus) |
| 3 | [x] | `Adhesion` | `Bám Dính` | Flashy Flash (100010-ur), King (100187-ur) |
| 4 | [x] | `Adhesion/Paralyzed` | `Bám Dính/Tê Liệt` | Suiryu (100183-ur) |
| 5 | [x] | `Advanced Core` | `Lõi Nâng Cao` | Child Emperor (100045-ur) |
| 6 | [x] | `Agility` | `Nhanh Nhẹn` | Atomic Samurai (100188-ur), Bom/Bengpu (100108-ssr), Boros (100184-ur), Child Emperor (100045-ur), Drive Knight (100044-ssr), Gale Wind (100126-ssr), Genos (100192-ur), Gouketsu (100089-ssr), Gyoro-Gyoro (100109-ssrplus), Hellish Blizzard (100009-ssr), Mosquito Girl (100008-ssr), Pig God (100057-ur) … (+2) |
| 7 | [x] | `All DMG Amplification` | `Tăng Sát Thương Toàn Phần` | Black Sperm (blacksperm-urplus) |
| 8 | [x] | `All DMG Reduction` | `Giảm Sát Thương Toàn Phần` | Black Sperm (blacksperm-urplus), Nyan (100312-urplus) |
| 9 | [x] | `Arena DMG Increase` | `Tăng Sát Thương Đấu Trường` | Bang & Bomb (100315-urplus) |
| 10 | [x] | `Arena DMG Reduction` | `Giảm Sát Thương Đấu Trường` | Bang & Bomb (100315-urplus), Zombieman (100013-urplus) |
| 11 | [x] | `Armed Collapse` | `Nội Thương Vũ Trang` | Bang (100024-ssrplus), Choze (100095-ssr), Gouketsu (100089-ur) |
| 12 | [x] | `Armor` | `Giáp` | Amai Mask (100029-urplus) |
| 13 | [x] | `Aura` | `Hào Quang` | Metal Bat (100185-ur) |
| 14 | [x] | `Awaken` | `Thức Tỉnh` | Mosquito Girl (100008-ssr) |
| 15 | [x] | `Banish` | `Trục Xuất` | Phoenix Man (100103-ssrplus) |
| 16 | [x] | `Basic Acceleration` | `Gia Tốc Cơ Bản` | Flashy Flash (100010-ssrplus) |
| 17 | [x] | `Basic Core` | `Lõi Cơ Bản` | Child Emperor (100045-ur) |
| 18 | [x] | `Berserk` | `Giận Dữ` | Bakuzan (100092-sr), Bang (100024-ssr), Boros (100055-ssr), Child Emperor (100045-ssr), Deep Sea King (100003-ur), Genos (100001-sr), Geryuganshoop (100059-ssr), Hammerhead (100007-sr), Hellish Blizzard (100009-sr), Hellish Blizzard (100009-ssr), Iairon (100018-sr), Metal Bat (100012-ssrplus) … (+4) |
| 19 | [x] | `Blind` | `Gây Mù` | Atomic Samurai (100011-ssr), Beast King (100049-sr), Deep Sea King (100003-ssrplus), Flashy Flash (100010-ssr), Gale Wind (100126-ssr), Garou (100094-ssr), Gyoro-Gyoro (100109-ssr), Gyoro-Gyoro (100109-ssrplus), Metal Bat (100012-ssr), Snek (100030-sr), Subterranean (100086-sr), Subterranean King (100017-ssr) … (+1) |
| 20 | [x] | `Block` | `Đỡ Đòn` | Child Emperor (100045-ur), Garou (100094-ur) |
| 21 | [x] | `Break` | `Phá Vỡ` | King (100187-ur) |
| 22 | [x] | `Break Armor` | `Phá Giáp` | Zombieman (100013-urplus) |
| 23 | [x] | `Breakthrough` | `Đột Phá` | Flashy Flash (100010-ur), Gouketsu (100089-ssrplus), Gouketsu (100089-ur), Melzargard (100054-ssrplus), Melzargard (100190-ur), Metal Bat (100012-ssrplus), Suiryu (100183-ur), Tank Top Master (100028-ssrplus) |
| 24 | [x] | `Buffer` | `Đệm Sát Thương` | Hellfire Flame (100191-ur) |
| 25 | [x] | `Burn` | `Thiêu Đốt` | Blue Fire (100046-sr), Genos (100001-sr), Genos (100074-ssr), Hellfire Flame (100125-ssr), Lightning Max (100005-sr), Magicman (100091-sr), Metal Knight (100075-ssr), Phoenix Man (100103-ssr), Subterranean King (100017-ssr), Vaccine Man V1 (100060-ssr) |
| 26 | [x] | `Burn/Forcefield/Injury/Internal Injury` | `Thiêu Đốt/Trường Lực/Trọng Thương/Nội Thương` | Child Emperor (100045-ssrplus) |
| 27 | [x] | `Burning` | `Thiêu Đốt` | Genos (100001-sr) |
| 28 | [x] | `Chain Detonate` | `Kích Nổ Liên Hoàn` | Hellish Blizzard (100009-ur) |
| 29 | [x] | `Chain Explosion` | `Bạo Nổ Lan Truyền` | Pig God (100057-ur) |
| 30 | [x] | `Chain Follow-up` | `Truy Kích Liên Hoàn` | Deep Sea King (100003-ssrplus), Metal Bat (100012-ssrplus) |
| 31 | [x] | `Charge` | `Tụ Lực` | Carnage Kabuto (100302-ur), G4 (100119-ssr), Suiryu (100090-ssr) |
| 32 | [x] | `Charge DMG` | `Sát Thương Tụ Lực` | Carnage Kabuto (100156-ssrplus) |
| 33 | [x] | `Charge DMG Reduction` | `Giảm Sát Thương Tụ Lực` | Geryuganshoop (100059-ssrplus) |
| 34 | [x] | `Charged` | `Đã Tụ Lực` | Drive Knight (100044-ssr) |
| 35 | [x] | `Charged Pursuit` | `Truy Kích Tụ Lực` | Black Sperm (blacksperm-urplus), G5 (100314-urplus), Nyan (100312-urplus), Overgrown Rover (100316-urplus), Zombieman (100013-urplus) |
| 36 | [x] | `Charm` | `Mê Hoặc` | Nyan (100312-urplus), Puri-Puri Prisoner (100006-ssrplus) |
| 37 | [x] | `Charm Immunity` | `Miễn Nhiễm Mê Hoặc` | Puri-Puri Prisoner (100006-ssrplus) |
| 38 | [x] | `Charm/Off Battle` | `Mê Hoặc/Rời Trận` | Melzargard (100190-ur) |
| 39 | [x] | `Chase` | `Truy Kích` | Atomic Samurai (100011-ssrplus) |
| 40 | [x] | `Chase DMG` | `Sát Thương Truy Kích` | Watchdog Man (100025-ssrplus) |
| 41 | [x] | `Cleanse` | `Thanh Tẩy` | Bang (100024-ssrplus), Flashy Flash (100010-ssrplus), Garou (100094-ssrplus) |
| 42 | [x] | `Collapse` | `Sụp Đổ` | Atomic Samurai (100011-ssr), Atomic Samurai (100188-ur), Child Emperor (100045-ssr), Dark Matter Thief (100068-r), Deep Sea King (100003-ur), Flashy Flash (100010-ssr), G4 (100182-ur), Gale Wind (100189-ur), Genos (100192-ur), Golden Ball (100015-sr), Gouketsu (100089-ur), King (100056-ssr) … (+2) |
| 43 | [x] | `Collapse (Duelist)` | `Sụp Đổ (Vũ Trang)` | Bang (100024-ssrplus), Gouketsu (100089-ur) |
| 44 | [x] | `Combo` | `Liên Kích` | Metal Knight (100075-ssrplus) |
| 45 | [x] | `Combo Attack` | `Tấn Công Liên Kích` | Bang (100024-ssrplus), Bom/Bengpu (100186-ur) |
| 46 | [x] | `Combo Follow-up` | `Truy Kích Liên Kích` | Deep Sea King (100003-ssrplus), King (100187-ur), Metal Knight (100075-ssrplus) |
| 47 | [x] | `Consecutive Follow-up` | `Truy Kích Liên Tiếp` | Deep Sea King (100003-ssrplus), Groribas (100062-ssrplus), King (100187-ur), Tank Top Master (100028-ssrplus) |
| 48 | [x] | `Continuous Explosion` | `Bạo Nổ Liên Tục` | Hellish Blizzard (100009-ur) |
| 49 | [x] | `Continuous Follow-Up` | `Truy Kích Liên Tục` | Suiryu (100183-ur) |
| 50 | [x] | `Continuous Pursuit` | `Truy Đuổi Liên Tục` | Metal Bat (100012-ssrplus) |
| 51 | [x] | `Control DMG Immunity` | `Miễn Nhiễm Sát Thương Khống Chế` | Boros (100184-urplus), Genos (100308-urplus), Metal Bat V2 (100157-ur) |
| 52 | [x] | `Corrode` | `Ăn Mòn` | Deep Sea King (100003-ssr), Deep Sea King (100003-ssrplus), Fukegao (100084-sr), Groribas (100062-ssr), Konbu Infinity (100063-sr), Messenger of the Seafolk (100034-sr), Metal Knight (100075-ssrplus), Pig God (100057-ur) |
| 53 | [x] | `Corrode DMG` | `Sát Thương Ăn Mòn` | Metal Knight (100075-ssrplus) |
| 54 | [x] | `Corrosion` | `Ăn Mòn` | Deep Sea Destroyer (200010-n), Deep Sea Invader (200033-n), Deep Sea King (100003-ssr), Deep Sea King (100003-ssrplus), Face Ripper (100111-sr), Fukegao (100084-sr), Konbu Infinity (100063-sr), Messenger of the Seafolk (100034-sr), Pig God (100057-ur) |
| 55 | [x] | `Corrupt` | `Tha Hóa` | Men's Esthetician Man (200013-n) |
| 56 | [x] | `Corrupted` | `Đã Tha Hóa` | Speed-o-Sound Sonic V1 (100002-ssr) |
| 57 | [x] | `Corruption` | `Tha Hóa` | Deep Sea Ravager (200031-n), Speed-o-Sound Sonic V1 (100002-ssr) |
| 58 | [x] | `Counter` | `Phản Kích` | Metal Bat V2 (100157-ur), Metal Knight (100075-ssrplus), Zombieman (100013-ur) |
| 59 | [x] | `Crash Bad` | `Đập Nát` | G4 (100182-ur) |
| 60 | [x] | `Crit` | `Bạo Kích` | Boros (100184-urplus), Garou (100094-ssrplus) |
| 61 | [x] | `Crit DMG` | `Sát Thương Bạo Kích` | Gyoro-Gyoro (100109-ssrplus), Hellish Blizzard (100009-ur), Tatsumaki/Terrible Tornado V1 (100004-ssr) |
| 62 | [x] | `Crit DMG Reduction` | `Giảm Sát Thương Bạo Kích` | Gyoro-Gyoro (100109-ssrplus), Hellish Blizzard (100009-ur) |
| 63 | [x] | `Critical Resistance` | `Kháng Bạo Kích` | Atomic Samurai (100313-urplus) |
| 64 | [x] | `Damage Immunity` | `Miễn Nhiễm Sát Thương` | Drive Knight (100044-ur) |
| 65 | [x] | `Damage Taken Up` | `Tăng Sát Thương Phải Chịu` | Drive Knight (100044-ssrplus) |
| 66 | [x] | `Death Immunity` | `Miễn Tử` | Garou (100094-ssrplus), Tank Top Master (100028-ssrplus) |
| 67 | [x] | `Deterrence` | `Uy Hiếp` | Amai Mask (100029-urplus), Garou (100094-ur), Metal Bat V2 (100157-ur), Sonic V2 (100069-ur), Subterranean King (100017-ur) |
| 68 | [x] | `Deterrent` | `Uy Hiếp` | Subterranean King (100017-ur), Zombieman (100013-urplus) |
| 69 | [x] | `Detonate` | `Kích Nổ` | Bang (100024-ssrplus), Boros (100184-ur), G4 (100182-ur), Genos (100192-ur), Gouketsu (100089-ur), Melzargard (100190-ur), Vaccine Man V2 (100085-ssr) |
| 70 | [x] | `detonates` | `Kích Nổ` | Vaccine Man V2 (100085-ssr) |
| 71 | [x] | `Detonation` | `Kích Nổ` | Genos (100192-ur), Melzargard (100190-ur), Tatsumaki/Terrible Tornado (100180-ur) |
| 72 | [x] | `Devour` | `Nuốt Chửng` | Pig God (100057-ssrplus) |
| 73 | [x] | `Devour Out of Combat` | `Nuốt Chửng Khi Ngoài Trận` | Pig God (100057-ssr) |
| 74 | [x] | `Devours` | `Nuốt Chửng` | Pig God (100057-ssr) |
| 75 | [x] | `Dexterity` | `Khéo Léo` | Pig God (100057-ssr) |
| 76 | [x] | `Direct DMG` | `Sát Thương Trực Tiếp` | Pig God (100057-ur) |
| 77 | [x] | `Disable` | `Vô Hiệu Hóa` | Flashy Flash (100010-ur) |
| 78 | [x] | `Disabled` | `Bị Vô Hiệu Hóa` | Watchdog Man (100025-ssrplus) |
| 79 | [x] | `Disorder` | `Rối Loạn` | Overgrown Rover (100316-urplus) |
| 80 | [x] | `Disorder DMG` | `Sát Thương Rối Loạn` | Overgrown Rover (100316-urplus) |
| 81 | [x] | `Dispels` | `Giải Trừ` | Armored Gorilla (100047-sr) |
| 82 | [x] | `Disrupt` | `Nhiễu Loạn` | Overgrown Rover (100316-urplus) |
| 83 | [x] | `Disrupt DMG` | `Sát Thương Nhiễu Loạn` | Overgrown Rover (100316-urplus) |
| 84 | [x] | `DMG Amplification` | `Khuếch Đại Sát Thương` | Geryuganshoop (100059-ssrplus) |
| 85 | [x] | `DMG Dealt` | `Sát Thương Gây Ra` | Eyesight (100149-ssr) |
| 86 | [x] | `DMG Free` | `Miễn Sát Thương` | Metal Bat (100012-ssr) |
| 87 | [x] | `DMG Immunity` | `Miễn Nhiễm Sát Thương` | Drive Knight (100044-ur) |
| 88 | [x] | `DMG Sharing` | `Chia Sẻ Sát Thương` | Genos (100192-ur), Pig God (100057-ur), Tank Top Master (100028-ssrplus) |
| 89 | [x] | `Dodge` | `Né Tránh` | Flashy Flash (100010-ssrplus), Gale Wind (100189-ur), Genos (100192-ur), Hellfire Flame (100191-ur), Metal Knight (100075-ssrplus), Sonic V1 (100002-ur), Subterranean King (100017-ssrplus), Watchdog Man (100025-ssrplus) |
| 90 | [x] | `DoT Bonus` | `Tăng Sát Thương Duy Trì` | Hellish Blizzard (100009-ur) |
| 91 | [x] | `DoT DMG Bonus Reduction` | `Giảm Phần Tăng Sát Thương Duy Trì` | Overgrown Rover (100316-urplus) |
| 92 | [x] | `DoT DMG Reduction` | `Giảm Sát Thương Duy Trì` | Overgrown Rover (100316-urplus) |
| 93 | [x] | `Encourage` | `Cổ Vũ` | Deep Sea King (100003-ur), Gale Wind (100189-ur), Sonic V1 (100002-ur), Sonic V2 (100069-ur), Zombieman (100013-ssrplus) |
| 94 | [x] | `Encourages` | `Cổ Vũ` | Fist Fight Djinn (100097-sr), Watchdog Man (100025-ssr) |
| 95 | [x] | `Endurance` | `Sức Bền` | Pig God (100057-ur) |
| 96 | [x] | `Energy Conversion` | `Chuyển Hóa Năng Lượng` | Bang & Bomb (100315-urplus), Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 97 | [x] | `Energy Cut` | `Cắt Giảm Năng Lượng` | Bang (100024-ssrplus), Flashy Flash (100010-ssrplus), Sonic V1 (100002-ur) |
| 98 | [x] | `Energy Gauge` | `Thanh Năng Lượng` | Amai Mask (100029-urplus), Atomic Samurai (100011-ssrplus), Atomic Samurai (100188-ur), Atomic Samurai (100313-urplus), Bang & Bomb (100315-urplus), Bang (100024-ssrplus), Black Sperm (blacksperm-urplus), Bom/Bengpu (100186-ur), Boros (100055-ssrplus), Boros (100184-urplus), Carnage Kabuto (100156-ssrplus), Carnage Kabuto (100302-ur) … (+50) |
| 99 | [x] | `Energy Pressure` | `Áp Lực Năng Lượng` | Bang & Bomb (100315-urplus) |
| 100 | [x] | `Energy Removal` | `Xóa Năng Lượng` | Gale Wind (100189-ur) |
| 101 | [x] | `Energy Resilience` | `Kháng Giảm Năng Lượng` | Bang & Bomb (100315-urplus), Boros (100184-urplus), G5 (100314-urplus), Tatsumaki/Terrible Tornado (100180-urplus) |
| 102 | [x] | `Energy Seal` | `Phong Ấn Năng Lượng` | Zombieman (100013-ur) |
| 103 | [x] | `Energy Shield Rate` | `Tỷ Lệ Khiên Năng Lượng` | Pig God (100057-ur) |
| 104 | [x] | `Energy Suppression` | `Áp Chế Năng Lượng` | Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 105 | [x] | `Energy Tenacity` | `Kiên Cường Năng Lượng` | Bang & Bomb (100315-urplus), Boros (100184-urplus), G5 (100314-urplus), Tatsumaki/Terrible Tornado (100180-urplus) |
| 106 | [x] | `Enhance` | `Cường Hóa` | Hellish Blizzard (100009-ur) |
| 107 | [x] | `Enhanced Unyielding` | `Bất Khuất Cường Hóa` | Atomic Samurai (100011-ssrplus), Gouketsu (100089-ssrplus) |
| 108 | [x] | `Evade` | `Né Tránh` | Bom/Bengpu (100186-ur), Flashy Flash (100010-ssrplus), Metal Knight (100075-ssrplus), Subterranean King (100017-ssrplus), Watchdog Man (100025-ssrplus) |
| 109 | [x] | `Evaded` | `Đã Né Tránh` | Melzargard (100190-ur) |
| 110 | [x] | `Evasion` | `Khả Năng Né Tránh` | Gale Wind (100189-ur), Genos (100192-ur), Hellfire Flame (100191-ur), Metal Bat V2 (100157-ur), Sonic V1 (100002-ur) |
| 111 | [x] | `Evolve` | `Tiến Hóa` | Boros (100184-ur), Drive Knight (100044-ssrplus) |
| 112 | [x] | `Excess Recovery` | `Hồi Phục Dư Thừa` | Boros (100184-ur) |
| 113 | [x] | `Exit` | `Rời Trận` | Pig God (100057-ssrplus) |
| 114 | [x] | `Exited` | `Đã Rời Trận` | Tank Top Master (100028-ssrplus) |
| 115 | [x] | `Explosion` | `Bạo Nổ` | Boros (100184-urplus) |
| 116 | [x] | `Extra Action Disabled` | `Vô Hiệu Hóa Hành Động Thêm` | Flashy Flash (100010-ur) |
| 117 | [x] | `Extreme Energy Drain` | `Rút Năng Lượng Cực Hạn` | Gyoro-Gyoro (100109-ur) |
| 118 | [x] | `Extreme Unyielding` | `Bất Khuất Cực Hạn` | Gyoro-Gyoro (100109-ur), Overgrown Rover (100316-urplus) |
| 119 | [x] | `Faint` | `Bất Tỉnh` | Metal Knight (100075-ssrplus), Subterranean King (100017-ur) |
| 120 | [x] | `Faint Final` | `Bất Tỉnh Cuối Cùng` | Subterranean King (100017-ur) |
| 121 | [x] | `Faint's` | `Bất Tỉnh` | Garou (100094-ur), Subterranean King (100017-ur) |
| 122 | [x] | `Fear` | `Sợ Hãi` | Bang (100024-ssrplus), Flashy Flash (100010-ssrplus), Gale Wind (100189-ur), Hellish Blizzard (100009-ssr) |
| 123 | [x] | `Fear/Specialized Fear` | `Sợ Hãi/Sợ Hãi Chuyên Biệt` | Gyoro-Gyoro (100109-ur) |
| 124 | [x] | `Feign Death` | `Giả Chết` | Zombieman (100013-ur) |
| 125 | [x] | `Field` | `Lĩnh Vực` | Butterfly DX (100154-sr), Tatsumaki/Terrible Tornado (100180-ur), Vaccine Man V2 (100085-ssr) |
| 126 | [x] | `Fields` | `Các Lĩnh Vực` | Vaccine Man V2 (100085-ssr) |
| 127 | [x] | `Follow-up` | `Truy Kích` | Amai Mask (100029-ssr), Atomic Samurai (100011-ssr), Beast King (100049-sr), Deep Sea King (100003-ssrplus), Flashy Flash (100010-ssr), Gale Wind (100126-ssr), Garou (100094-ssr), Groribas (100062-ssrplus), Gyoro-Gyoro (100109-ssr), Gyoro-Gyoro (100109-ssrplus), King (100187-ur), Metal Bat (100012-ssr) … (+5) |
| 128 | [x] | `Follow-up DMG` | `Sát Thương Truy Kích` | Watchdog Man (100025-ssrplus) |
| 129 | [x] | `Force Field` | `Trường Lực` | Awakened Cockroach (100135-sr), Drive Knight (100044-ssr), Tatsumaki/Terrible Tornado V2 (100151-ssr), Vaccine Man V2 (100085-ssr) |
| 130 | [x] | `Formation` | `Trận Hình` | Tatsumaki/Terrible Tornado (100180-ur) |
| 131 | [x] | `Freeze` | `Đóng Băng` | Hellish Blizzard (100009-ur) |
| 132 | [x] | `Generate Shield` | `Tạo Khiên` | Child Emperor (100045-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 133 | [x] | `Giant` | `Khổng Lồ` | Vaccine Man V2 (100085-ssr) |
| 134 | [x] | `Heal Block` | `Cấm Hồi Máu` | Subterranean King (100017-ssrplus) |
| 135 | [x] | `Heal Rate` | `Tỷ Lệ Hồi Máu` | Bom/Bengpu (100108-ssr) |
| 136 | [x] | `HP Shield` | `Khiên Sinh Lực` | Boros (100184-ur) |
| 137 | [x] | `Hyper Speed` | `Siêu Tốc` | Flashy Flash (100010-ssrplus), Flashy Flash (100010-ur), Sonic V1 (100002-ur), Zombieman (100013-ssrplus) |
| 138 | [x] | `Hyper Speed Field: ATK` | `Lĩnh Vực Siêu Tốc: Tấn Công` | Amai Mask (100029-urplus) |
| 139 | [x] | `Hyper Speed Field: DEF` | `Lĩnh Vực Siêu Tốc: Phòng Thủ` | Amai Mask (100029-urplus) |
| 140 | [x] | `Ice` | `Băng` | Hellish Blizzard (100009-ur) |
| 141 | [x] | `Ice DMG` | `Sát Thương Băng` | Pig God (100057-ur) |
| 142 | [x] | `Ignore DMG` | `Bỏ Qua Sát Thương` | Boros (100184-ur), Drive Knight (100044-ssrplus), Garou (100094-ssrplus) |
| 143 | [x] | `Immortal` | `Bất Tử` | Gouketsu (100089-ssrplus), Pig God (100057-ssrplus), Superalloy Darkshine (100027-ssrplus) |
| 144 | [x] | `Immune` | `Miễn Nhiễm` | Gouketsu (100089-ur), Melzargard (100190-ur) |
| 145 | [x] | `Immune to Death` | `Miễn Tử` | Tank Top Master (100028-ssrplus) |
| 146 | [x] | `ImmuneNotDeath` | `Miễn Nhiễm Tử Vong` | Garou (100094-ssrplus) |
| 147 | [x] | `ImmuneNotDeathMix2` | `Miễn Tử Hỗn Hợp II` | Garou (100094-ur) |
| 148 | [x] | `Immunity` | `Miễn Nhiễm` | Flashy Flash (100010-ur), Gouketsu (100089-ssrplus), Gouketsu (100089-ur), Melzargard (100190-ur), Metal Bat (100012-ssrplus), Metal Bat V2 (100157-ur) |
| 149 | [x] | `Immunity against Extra DMG` | `Miễn Nhiễm Sát Thương Bổ Sung` | Metal Bat (100012-ssrplus) |
| 150 | [x] | `Immunity against Silence` | `Miễn Nhiễm Câm Lặng` | Melzargard (100054-ssrplus) |
| 151 | [x] | `Immunity against Stun` | `Miễn Nhiễm Choáng` | Melzargard (100054-ssrplus), Metal Bat (100012-ssrplus) |
| 152 | [x] | `Increase Control DMG` | `Tăng Sát Thương Khống Chế` | Atomic Samurai (100313-urplus), Genos (100308-urplus) |
| 153 | [x] | `Increase DMG Res` | `Tăng Kháng Sát Thương` | Bang & Bomb (100315-urplus) |
| 154 | [x] | `Increased DMG from Resistance` | `Tăng Sát Thương Theo Kháng` | Bang & Bomb (100315-urplus) |
| 155 | [x] | `Injured` | `Bị Thương` | Amai Mask (100029-sr), Awakened Cockroach (100135-sr), Beast King (100049-sr), Charanko (100067-n), D-pad (100032-r), Fukegao (100084-sr), Hamukichi (100148-sr), Heavy Tank Loincloth (100110-sr), Metal Bat (100012-ssr), Metal Knight (100075-ssr), Superalloy Darkshine (100027-ssr), Tatsumaki/Terrible Tornado V1 (100004-ssr) … (+1) |
| 156 | [x] | `Injury` | `Trọng Thương` | Carnage Kabuto (100043-ssr), Carnage Kabuto (100302-ur) |
| 157 | [x] | `Injury DMG Free` | `Miễn Sát Thương Trọng Thương` | Carnage Kabuto (100302-ur) |
| 158 | [x] | `Injury DMG Immunity` | `Miễn Nhiễm Sát Thương Trọng Thương` | Carnage Kabuto (100302-ur) |
| 159 | [x] | `Insta-Dodge` | `Né Tức Thì` | Bang (100024-ssrplus), Drive Knight (100044-ssrplus), Gouketsu (100089-ur) |
| 160 | [x] | `Instant DMG Evasion` | `Né Sát Thương Tức Thì` | Bang (100024-ssrplus), Drive Knight (100044-ssrplus), Flashy Flash (100010-ur), Garou (100094-ur), Pig God (100057-ur), Sonic V2 (100069-ur) |
| 161 | [x] | `Instant Miss` | `Trượt Tức Thì` | Gouketsu (100089-ur) |
| 162 | [x] | `Internal Injury` | `Nội Thương` | Awakened Cockroach (100135-sr), Bakuzan (100092-sr), Bang (100024-ssr), Bang (100024-ssrplus), Bom/Bengpu (100186-ur), Carnage Kabuto (100302-ur), Choze (100095-sr), Choze (100095-ssr), Gale Wind (100126-ssr), Garou (100094-ssr), Gouketsu (100089-ssr), Rinrin (100120-sr) … (+1) |
| 163 | [x] | `Invincible` | `Vô Địch` | Black Sperm (blacksperm-urplus), Garou (100094-ur), Melzargard (100190-ur) |
| 164 | [x] | `Kinetic Recovery` | `Hồi Phục Động Năng` | Metal Bat V2 (100157-ur) |
| 165 | [x] | `Life Link` | `Liên Kết Sinh Mệnh` | Nyan (100312-urplus), Zombieman (100013-urplus) |
| 166 | [x] | `Life Shield` | `Khiên Sinh Mệnh` | King (100187-ur) |
| 167 | [x] | `Lifesteal` | `Hút Máu` | Eyesight (100149-ssr) |
| 168 | [x] | `Limited Energy Deduction` | `Giới Hạn Trừ Năng Lượng` | Gyoro-Gyoro (100109-ur) |
| 169 | [x] | `Link` | `Liên Kết` | Zombieman (100013-urplus) |
| 170 | [x] | `Lock` | `Khóa` | Atomic Samurai (100011-ssr), Beast King (100049-sr), Deep Sea King (100003-ssrplus), Flashy Flash (100010-ssr), Gale Wind (100126-ssr), Garou (100094-ssr), Gyoro-Gyoro (100109-ssr), Gyoro-Gyoro (100109-ssrplus), Gyoro-Gyoro (100109-ur), Metal Bat (100012-ssr), Snek (100030-sr), Subterranean (100086-sr) … (+2) |
| 171 | [x] | `Lock Target` | `Khóa Mục Tiêu` | Hellish Blizzard (100009-ur) |
| 172 | [x] | `Locked` | `Đã Khóa` | Hellish Blizzard (100009-ur) |
| 173 | [x] | `Locked On` | `Đã Khóa Mục Tiêu` | Pig God (100057-ur) |
| 174 | [x] | `Mark` | `Đánh Dấu` | Bang (100024-ssrplus), Garou (100094-ssrplus), Melzargard (100054-ssrplus), Metal Bat V2 (100157-ur), Metal Knight (100075-ssrplus) |
| 175 | [x] | `Max HP Reduction` | `Giảm HP Tối Đa` | Flashy Flash (100010-ur) |
| 176 | [x] | `Max HP Up` | `Tăng HP Tối Đa` | Gouketsu (100089-ssrplus) |
| 177 | [x] | `Mixed Death Immunity` | `Miễn Tử Hỗn Hợp` | Garou (100094-ur) |
| 178 | [x] | `Momentum Return` | `Hoàn Trả Động Lực` | Metal Bat V2 (100157-ur), Overgrown Rover (100316-urplus) |
| 179 | [x] | `Monster Affinity` | `Tương Hợp Quái Nhân` | Nyan (100312-urplus) |
| 180 | [x] | `Nimble` | `Linh Hoạt` | Gyoro-Gyoro (100109-ur) |
| 181 | [x] | `No Crit No Death` | `Không Bạo Kích, Không Tử` | Boros (100184-ur), Garou (100094-ur) |
| 182 | [x] | `No Revival` | `Cấm Hồi Sinh` | Subterranean King (100017-ssrplus) |
| 183 | [x] | `Non-Crit DMG Free` | `Miễn Sát Thương Không Bạo Kích` | Atomic Samurai (100011-ssrplus), Black Sperm (blacksperm-urplus), Bom/Bengpu (100108-ssr), Boros (100184-ur), Child Emperor (100045-ur), Drive Knight (100044-ur), Gyoro-Gyoro (100109-ssrplus), Gyoro-Gyoro (100109-ur), Hellish Blizzard (100009-ssr), Hellish Blizzard (100009-ur), Mosquito Girl (100008-ssr), Pig God (100057-ur) … (+2) |
| 184 | [x] | `Non-Crit DMG Immunity` | `Miễn Nhiễm Sát Thương Không Bạo Kích` | Boros (100184-ur), Child Emperor (100045-ur), Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 185 | [x] | `Non-Crit DMG Reduction` | `Giảm Sát Thương Không Bạo Kích` | Amai Mask (100029-urplus), Atomic Samurai (100313-urplus), Bang & Bomb (100315-urplus), Boros (100184-urplus), G5 (100314-urplus), Genos (100308-urplus), Gyoro-Gyoro (100109-ur), Metal Bat V2 (100157-ur), Mosquito Girl (100008-ur), Nyan (100312-urplus), Overgrown Rover (100316-urplus), Tatsumaki/Terrible Tornado (100180-urplus) … (+1) |
| 186 | [x] | `Non-Crit Immunity` | `Miễn Nhiễm Đòn Không Bạo Kích` | Boros (100184-ur), Garou (100094-ur) |
| 187 | [x] | `Non-Critical Hit Invincibility` | `Vô Địch Trước Đòn Không Bạo Kích` | Boros (100184-urplus), G5 (100314-urplus) |
| 188 | [x] | `Nullify` | `Vô Hiệu Hóa` | Flashy Flash (100010-ur), Watchdog Man (100025-ssrplus) |
| 189 | [x] | `Nullity` | `Hư Vô` | Groribas (100062-ssrplus) |
| 190 | [x] | `Off Battle` | `Rời Trận` | Pig God (100057-ssrplus) |
| 191 | [x] | `Out of Combat` | `Ngoài Trận` | Pig God (100057-ssr) |
| 192 | [x] | `Overflow Recovery` | `Hồi Phục Tràn` | King (100187-ur) |
| 193 | [x] | `Overheal` | `Hồi Máu Vượt Mức` | King (100187-ur) |
| 194 | [x] | `Panic` | `Hoảng Loạn` | Geryuganshoop (100059-ssr), Gyoro-Gyoro (100109-ur), King (100056-ssr), King (100056-ssrplus), Tatsumaki/Terrible Tornado V2 (100151-ssr), Watchdog Man (100025-ssr) |
| 195 | [x] | `Panicked` | `Đã Hoảng Loạn` | Tatsumaki/Terrible Tornado V2 (100151-ssr) |
| 196 | [x] | `Paralysis` | `Tê Liệt` | King (100187-ur), Puri-Puri Prisoner (100006-ssrplus) |
| 197 | [x] | `Rage` | `Cuồng Nộ` | Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus), Zombieman (100013-urplus) |
| 198 | [x] | `Rampage` | `Bạo Tẩu` | Watchdog Man (100025-ssrplus) |
| 199 | [x] | `Rapid Divinity - ATK` | `Thần Tốc - Tấn Công` | Amai Mask (100029-urplus) |
| 200 | [x] | `Rapid Divinity - DEF` | `Thần Tốc - Phòng Thủ` | Amai Mask (100029-urplus) |
| 201 | [x] | `Re-battle` | `Tái Chiến` | Black Sperm (blacksperm-urplus), Overgrown Rover (100316-urplus), Zombieman (100013-urplus) |
| 202 | [x] | `Rebirth` | `Tái Sinh` | Gyoro-Gyoro (100109-ssrplus) |
| 203 | [x] | `Reborn` | `Đã Tái Sinh` | Gyoro-Gyoro (100109-ssrplus), Melzargard (100054-ssrplus) |
| 204 | [x] | `Reduce Control DMG` | `Giảm Sát Thương Khống Chế` | Atomic Samurai (100313-urplus) |
| 205 | [x] | `Reduce Crit DMG` | `Giảm Sát Thương Bạo Kích` | Bang & Bomb (100315-urplus), Tatsumaki/Terrible Tornado (100180-urplus) |
| 206 | [x] | `Reduce DMG Res` | `Giảm Kháng Sát Thương` | Bang & Bomb (100315-urplus) |
| 207 | [x] | `Reduce Non-Crit DMG` | `Giảm Sát Thương Không Bạo Kích` | Atomic Samurai (100313-urplus), Mosquito Girl (100008-ur), Nyan (100312-urplus), Overgrown Rover (100316-urplus) |
| 208 | [x] | `Reduce True DMG` | `Giảm Sát Thương Chuẩn` | Overgrown Rover (100316-urplus) |
| 209 | [x] | `Reduced DMG from Resistance` | `Giảm Sát Thương Theo Kháng` | Amai Mask (100029-urplus), Bang & Bomb (100315-urplus) |
| 210 | [x] | `Re-Fight` | `Tái Chiến` | Overgrown Rover (100316-urplus) |
| 211 | [x] | `Refresh` | `Làm Mới` | Carnage Kabuto (100302-ur) |
| 212 | [x] | `Regeneration` | `Hồi Phục` | Awakened Cockroach (100135-sr), Genos (100074-ssr), Melzargard (100054-ssrplus), Phoenix Man (100103-ssr), Zombieman (100013-ssr) |
| 213 | [x] | `Regroup` | `Tập Hợp Lại` | Black Sperm (blacksperm-urplus), Metal Bat V2 (100157-ur), Overgrown Rover (100316-urplus) |
| 214 | [x] | `Rematch` | `Tái Đấu` | Overgrown Rover (100316-urplus) |
| 215 | [x] | `Resilience` | `Bền Bỉ` | Pig God (100057-ur) |
| 216 | [x] | `Resilience/Tenacity` | `Bền Bỉ/Kiên Cường` | Hellfire Flame (100125-ssr) |
| 217 | [x] | `Resist DMG Immunity` | `Miễn Nhiễm Sát Thương Kháng` | Amai Mask (100029-urplus) |
| 218 | [x] | `Resurrect` | `Hồi Sinh` | Drive Knight (100044-ur), Melzargard (100054-ssrplus), Melzargard (100190-ur), Zombieman (100013-ssrplus) |
| 219 | [x] | `Resurrected` | `Đã Hồi Sinh` | Subterranean King (100017-ssrplus) |
| 220 | [x] | `Resurrection` | `Hồi Sinh` | Bang & Bomb (100315-urplus), Boros (100184-urplus), G5 (100314-urplus), Zombieman (100013-ssrplus) |
| 221 | [x] | `Revenge` | `Trả Thù` | Drive Knight (100044-ur), G5 (100314-urplus), Overgrown Rover (100316-urplus) |
| 222 | [x] | `Revenge Revival` | `Hồi Sinh Báo Thù` | Metal Bat V2 (100157-ur) |
| 223 | [x] | `Revenge+` | `Trả Thù+` | Drive Knight (100044-ur) |
| 224 | [x] | `Revival` | `Hồi Sinh` | Drive Knight (100044-ur), Melzargard (100190-ur) |
| 225 | [x] | `Revive` | `Hồi Sinh` | Bang & Bomb (100315-urplus), Boros (100184-urplus), G5 (100314-urplus), Melzargard (100054-ssrplus), Zombieman (100013-ssrplus), Zombieman (100013-ur), Zombieman (100013-urplus) |
| 226 | [x] | `Revived` | `Đã Hồi Sinh` | Subterranean King (100017-ssrplus) |
| 227 | [x] | `Round` | `Hiệp` | Metal Knight (100075-ssrplus) |
| 228 | [x] | `Self-detonation` | `Tự Bạo` | Gyoro-Gyoro (100109-ssrplus) |
| 229 | [x] | `Separation` | `Phân Tách` | Mosquito Girl (100008-ur) |
| 230 | [x] | `Share DMG` | `Chia Sẻ Sát Thương` | Genos (100192-ur) |
| 231 | [x] | `Shatter` | `Nứt Vỡ` | Amai Mask (100029-urplus), Bushidoriru (100096-sr), Child Emperor (100045-ssr), Death Gatling (100136-sr), G4 (100119-ssr), Gale Wind (100189-ur), Iairon (100018-sr), Melzargard (100190-ur), Spring Mustachio (100016-sr), Stinger (100014-sr) |
| 232 | [x] | `Shield` | `Khiên` | Child Emperor (100045-ur), King (100056-ssrplus), Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 233 | [x] | `Shield Break` | `Phá Khiên` | Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 234 | [x] | `Silence` | `Câm Lặng` | Gyoro-Gyoro (100109-ssrplus), Melzargard (100054-ssrplus), Mosquito Girl (100008-ur), Subterranean King (100017-ur), Zombieman (100013-urplus) |
| 235 | [x] | `Smart Corrode` | `Ăn Mòn Đặc Hóa` | Groribas (100062-ssrplus) |
| 236 | [x] | `Smart Corrode DMG` | `Sát Thương Ăn Mòn Đặc Hóa` | Metal Knight (100075-ssrplus) |
| 237 | [x] | `Smart Corrosion` | `Ăn Mòn Đặc Hóa` | Groribas (100062-ssrplus) |
| 238 | [x] | `Smart DoT` | `Sát Thương Duy Trì Đặc Hóa` | Sonic V1 (100002-ur) |
| 239 | [x] | `Spec. Burn` | `Thiêu Đốt Chuyên Biệt` | G4 (100182-ur), Genos (100192-ur), Hellfire Flame (100191-ur), Subterranean King (100017-ssrplus) |
| 240 | [x] | `Spec. Collapse` | `Sụp Đổ Chuyên Biệt` | Gale Wind (100189-ur), Melzargard (100190-ur) |
| 241 | [x] | `Spec. Direct DMG` | `Sát Thương Trực Tiếp Chuyên Biệt` | Amai Mask (100029-urplus), Atomic Samurai (100313-urplus), Nyan (100312-urplus), Overgrown Rover (100316-urplus) |
| 242 | [x] | `Spec. Dodge` | `Né Tránh Chuyên Biệt` | Amai Mask (100029-urplus), Carnage Kabuto (100302-ur), Nyan (100312-urplus), Overgrown Rover (100316-urplus), Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 243 | [x] | `Spec. Guard` | `Phòng Hộ Chuyên Biệt` | G4 (100182-ur), Suiryu (100183-ur) |
| 244 | [x] | `Spec. HP` | `HP Chuyên Biệt` | Amai Mask (100029-urplus), Atomic Samurai (100313-urplus), Bang & Bomb (100315-urplus), Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 245 | [x] | `Spec. Protect` | `Bảo Hộ Chuyên Biệt` | Metal Knight (100075-ssrplus), Subterranean King (100017-ssrplus) |
| 246 | [x] | `Spec. Regeneration` | `Hồi Phục Chuyên Biệt` | Zombieman (100013-urplus) |
| 247 | [x] | `Spec. Speed Up` | `Tăng Tốc Chuyên Biệt` | Gale Wind (100189-ur), Nyan (100312-urplus), Sonic V1 (100002-ur), Zombieman (100013-ur) |
| 248 | [x] | `Spec. Stun` | `Choáng Chuyên Biệt` | Amai Mask (100029-urplus), G4 (100182-ur), Metal Knight (100075-ssrplus), Mosquito Girl (100008-ur) |
| 249 | [x] | `Spec. Unyielding` | `Bất Khuất Chuyên Biệt` | Amai Mask (100029-urplus), Boros (100184-ur), G5 (100314-urplus), Melzargard (100190-ur), Nyan (100312-urplus), Overgrown Rover (100316-urplus), Suiryu (100183-ur), Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 250 | [x] | `Specialize Breakthrough` | `Đột Phá Chuyên Biệt` | Mosquito Girl (100008-ur) |
| 251 | [x] | `Specialized Acceleration` | `Gia Tốc Chuyên Biệt` | Gale Wind (100189-ur), Nyan (100312-urplus), Sonic V1 (100002-ur), Zombieman (100013-ssrplus), Zombieman (100013-ur) |
| 252 | [x] | `Specialized Berserk` | `Cuồng Bạo Chuyên Biệt` | King (100187-ur), Superalloy Darkshine (100027-ssrplus) |
| 253 | [x] | `Specialized Breakthrough` | `Đột Phá Chuyên Biệt` | Metal Bat V2 (100157-ur), Zombieman (100013-ur) |
| 254 | [x] | `Specialized Burn` | `Thiêu Đốt Chuyên Biệt` | G4 (100182-ur), Genos (100192-ur), Hellfire Flame (100191-ur), Sonic V1 (100002-ur), Subterranean King (100017-ssrplus) |
| 255 | [x] | `Specialized Charm` | `Mê Hoặc Chuyên Biệt` | Nyan (100312-urplus) |
| 256 | [x] | `Specialized Collapse` | `Sụp Đổ Chuyên Biệt` | Atomic Samurai (100188-ur) |
| 257 | [x] | `Specialized Corrode` | `Ăn Mòn Chuyên Biệt` | Deep Sea King (100003-ssrplus), Metal Knight (100075-ssrplus), Pig God (100057-ssrplus) |
| 258 | [x] | `Specialized Direct DMG` | `Sát Thương Trực Tiếp Chuyên Biệt` | Amai Mask (100029-urplus), Black Sperm (blacksperm-urplus), G5 (100314-urplus), Genos (100308-urplus), Nyan (100312-urplus), Overgrown Rover (100316-urplus), Zombieman (100013-urplus) |
| 259 | [x] | `Specialized Disable` | `Vô Hiệu Hóa Chuyên Biệt` | Flashy Flash (100010-ur) |
| 260 | [x] | `Specialized DMG Reflect` | `Phản Sát Thương Chuyên Biệt` | Bom/Bengpu (100186-ur), Deep Sea King (100003-ur), Groribas (100062-ssrplus), Metal Bat V2 (100157-ur), Superalloy Darkshine (100027-ssrplus) |
| 261 | [x] | `Specialized Dodge` | `Né Tránh Chuyên Biệt` | Subterranean King (100017-ur) |
| 262 | [x] | `Specialized Evade` | `Né Tránh Chuyên Biệt` | Boros (100184-ur) |
| 263 | [x] | `Specialized Evasion` | `Khả Năng Né Tránh Chuyên Biệt` | Amai Mask (100029-urplus), Atomic Samurai (100313-urplus), Bang & Bomb (100315-urplus), Black Sperm (blacksperm-urplus), Boros (100184-urplus), Carnage Kabuto (100302-ur), G5 (100314-urplus), Genos (100308-urplus), Metal Bat V2 (100157-ur), Nyan (100312-urplus), Overgrown Rover (100316-urplus), Tatsumaki/Terrible Tornado (100180-ur) … (+2) |
| 264 | [x] | `Specialized Evolve` | `Tiến Hóa Chuyên Biệt` | Carnage Kabuto (100302-ur) |
| 265 | [x] | `Specialized Extra DMG` | `Sát Thương Bổ Sung Chuyên Biệt` | Bom/Bengpu (100186-ur) |
| 266 | [x] | `Specialized Fear` | `Sợ Hãi Chuyên Biệt` | Subterranean King (100017-ur) |
| 267 | [x] | `Specialized Guard` | `Phòng Hộ Chuyên Biệt` | G4 (100182-ur), Groribas (100062-ssrplus), King (100187-ur), Pig God (100057-ssrplus), Suiryu (100183-ur), Tatsumaki/Terrible Tornado (100180-ur) |
| 268 | [x] | `Specialized HP` | `HP Chuyên Biệt` | Amai Mask (100029-urplus), Atomic Samurai (100313-urplus), Bang & Bomb (100315-urplus), G5 (100314-urplus), Gyoro-Gyoro (100109-ur), Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |
| 269 | [x] | `Specialized Panic` | `Hoảng Loạn Chuyên Biệt` | Gyoro-Gyoro (100109-ur) |
| 270 | [x] | `Specialized Protection` | `Bảo Hộ Chuyên Biệt` | Drive Knight (100044-ssrplus), Melzargard (100054-ssrplus), Metal Knight (100075-ssrplus), Subterranean King (100017-ssrplus), Tank Top Master (100028-ssrplus) |
| 271 | [x] | `Specialized Regeneration` | `Hồi Phục Chuyên Biệt` | Zombieman (100013-urplus) |
| 272 | [x] | `Specialized Resilience` | `Bền Bỉ Chuyên Biệt` | Child Emperor (100045-ur) |
| 273 | [x] | `Specialized Shatter` | `Nứt Vỡ Chuyên Biệt` | Gale Wind (100189-ur), Melzargard (100190-ur) |
| 274 | [x] | `Specialized Speed` | `Tốc Độ Chuyên Biệt` | Nyan (100312-urplus), Sonic V2 (100069-ur) |
| 275 | [x] | `Specialized Speed Up` | `Tăng Tốc Chuyên Biệt` | Flashy Flash (100010-ssrplus), Flashy Flash (100010-ur), Sonic V2 (100069-ur) |
| 276 | [x] | `Specialized Stun` | `Choáng Chuyên Biệt` | Amai Mask (100029-urplus), G4 (100182-ur), Garou (100094-ur), Metal Bat V2 (100157-ur), Metal Knight (100075-ssrplus), Mosquito Girl (100008-ur), Sonic V2 (100069-ur), Tatsumaki/Terrible Tornado (100180-ur), Zombieman (100013-urplus) |
| 277 | [x] | `Specialized Unyielding` | `Bất Khuất Chuyên Biệt` | Amai Mask (100029-urplus), Atomic Samurai (100313-urplus), Bang & Bomb (100315-urplus), Black Sperm (blacksperm-urplus), Boros (100184-ur), Boros (100184-urplus), G5 (100314-urplus), Genos (100308-urplus), Geryuganshoop (100059-ssrplus), Gouketsu (100089-ur), Melzargard (100190-ur), Nyan (100312-urplus) … (+7) |
| 278 | [x] | `Speed Field Attack` | `Lĩnh Vực Tốc Độ: Tấn Công` | Sonic V2 (100069-ur) |
| 279 | [x] | `Speed Field Defense` | `Lĩnh Vực Tốc Độ: Phòng Thủ` | Sonic V2 (100069-ur) |
| 280 | [x] | `Stick` | `Bám Dính` | Groribas (100062-ssrplus) |
| 281 | [x] | `Stuck` | `Bị Bám Dính` | Deep Sea King (100003-ssrplus), Tank Top Master (100028-ssrplus) |
| 282 | [x] | `Stun` | `Choáng` | Amai Mask (100029-urplus), Awakened Cockroach (100135-sr), Child Emperor (100045-ssr), Eyesight (100149-ssr), G4 (100182-ur), Gale Wind (100126-ssr), Gale Wind (100189-ur), Garou (100094-ssrplus), Garou (100094-ur), Gouketsu (100089-ssrplus), Hammerhead (100007-sr), Lightning Max (100005-sr) … (+11) |
| 283 | [x] | `Stun/Specialized Stun` | `Choáng/Choáng Chuyên Biệt` | Hellfire Flame (100191-ur), Tatsumaki/Terrible Tornado (100180-ur) |
| 284 | [x] | `Super Speed` | `Siêu Tốc` | Zombieman (100013-ssrplus), Zombieman (100013-ur) |
| 285 | [x] | `Superspeed` | `Siêu Tốc` | Sonic V1 (100002-ur) |
| 286 | [x] | `Support Enhancement` | `Tăng Cường Hỗ Trợ` | Black Sperm (blacksperm-urplus) |
| 287 | [x] | `Suppression DMG Increase` | `Tăng Sát Thương Áp Chế` | Atomic Samurai (100313-urplus), Genos (100308-urplus), Nyan (100312-urplus) |
| 288 | [x] | `Suppression DMG Reduction` | `Giảm Sát Thương Áp Chế` | Atomic Samurai (100313-urplus), Boros (100184-urplus), Genos (100308-urplus), Metal Bat V2 (100157-ur), Nyan (100312-urplus) |
| 289 | [x] | `Tenacity` | `Lá Chắn` | Amai Mask (100029-ssr), Armored Gorilla (100047-sr), Bang (100024-ssr), Bushidoriru (100096-sr), Butterfly DX (100154-sr), Child Emperor (100045-ur), Deep Sea King (100003-ssr), Flashy Flash (100010-ssr), G4 (100119-ssr), Hammerhead (100007-sr), Heavy Tank Loincloth (100110-sr), Hellfire Flame (100125-ssr) … (+16) |
| 290 | [x] | `Tenacity Boost` | `Tăng Lá Chắn` | Hellfire Flame (100125-ssr) |
| 291 | [x] | `Tenacity-type state` | `Trạng Thái Lá Chắn` | Lightning Genji (100051-sr) |
| 292 | [x] | `ThiÃªu Äá»‘t` | `Thiêu Đốt` | Blue Fire (100046-sr), Genos (100001-sr), Genos (100074-ssr), Hellfire Flame (100125-ssr), Lightning Max (100005-sr), Magicman (100091-sr), Metal Knight (100075-ssr), Phoenix Man (100103-ssr), Subterranean King (100017-ssr), Vaccine Man V1 (100060-ssr) |
| 293 | [x] | `Threaten` | `Uy Hiếp` | Amai Mask (100029-urplus), Garou (100094-ur), Metal Bat V2 (100157-ur), Sonic V2 (100069-ur), Subterranean King (100017-ur) |
| 294 | [x] | `Total DMG Reduction` | `Giảm Tổng Sát Thương` | Atomic Samurai (100313-urplus) |
| 295 | [x] | `Toughness` | `Độ Cứng` | Pig God (100057-ur) |
| 296 | [x] | `True Damage` | `Sát Thương Chuẩn` | Gyoro-Gyoro (100109-ur), Pig God (100057-ur) |
| 297 | [x] | `True DMG` | `Sát Thương Chuẩn` | Carnage Kabuto (100302-ur), Drive Knight (100044-ur), Garou (100094-ur), Genos (100192-ur), Pig God (100057-ur) |
| 298 | [x] | `True DMG Reduction` | `Giảm Sát Thương Chuẩn` | Overgrown Rover (100316-urplus) |
| 299 | [x] | `Truy KÃ­ch` | `Truy Kích` | Atomic Samurai (100011-ssr), Beast King (100049-sr), Deep Sea King (100003-ssrplus), Flashy Flash (100010-ssr), Gale Wind (100126-ssr), Garou (100094-ssr), Gyoro-Gyoro (100109-ssr), Gyoro-Gyoro (100109-ssrplus), Metal Bat (100012-ssr), Snek (100030-sr), Subterranean (100086-sr), Subterranean King (100017-ssr) … (+1) |
| 300 | [x] | `Ult Follow-up` | `Truy Kích Tuyệt Kỹ` | Carnage Kabuto (100156-ssrplus), Deep Sea King (100003-ssrplus), Gyoro-Gyoro (100109-ssrplus) |
| 301 | [x] | `Ultimate` | `Tuyệt Kỹ` | Metal Bat (100012-ssrplus) |
| 302 | [x] | `Ultimate DMG Reduction` | `Giảm Sát Thương Tuyệt Kỹ` | Amai Mask (100029-ssr) |
| 303 | [x] | `Ultimate Follow-up` | `Truy Kích Tuyệt Kỹ` | Atomic Samurai (100188-ur), Carnage Kabuto (100156-ssrplus), Deep Sea King (100003-ssrplus), Flashy Flash (100010-ur), Garou (100094-ssrplus), Gyoro-Gyoro (100109-ssrplus), Metal Knight (100075-ssrplus), Tatsumaki/Terrible Tornado (100180-ur) |
| 304 | [x] | `Ultimate Unyielding` | `Bất Khuất Tuyệt Kỹ` | Bang & Bomb (100315-urplus), Overgrown Rover (100316-urplus) |
| 305 | [x] | `Undefeated` | `Bất Bại` | Black Sperm (blacksperm-urplus), Garou (100094-ur), Melzargard (100190-ur) |
| 306 | [x] | `Undying` | `Bất Tử` | Gouketsu (100089-ssrplus), Pig God (100057-ssrplus), Superalloy Darkshine (100027-ssrplus) |
| 307 | [x] | `Undying-Suppression` | `Áp Chế Bất Tử` | Drive Knight (100044-ur) |
| 308 | [x] | `Unyielding` | `Bất Khuất` | Amai Mask (100029-urplus), Atomic Samurai (100011-ssrplus), Atomic Samurai (100313-urplus), Bang & Bomb (100315-urplus), Black Sperm (blacksperm-urplus), Boros (100184-ur), Boros (100184-urplus), Deep Sea King (100003-ssrplus), Drive Knight (100044-ssrplus), Flashy Flash (100010-ssrplus), G5 (100314-urplus), Genos (100308-urplus) … (+12) |
| 309 | [x] | `Vengeance` | `Báo Thù` | Drive Knight (100044-ur) |
| 310 | [x] | `Vengeance Follow-up` | `Truy Kích Báo Thù` | Drive Knight (100044-ur) |
| 311 | [x] | `Void` | `Hư Vô` | Groribas (100062-ssrplus) |
| 312 | [x] | `Void Fist` | `Quyền Hư Vô` | Bang & Bomb (100315-urplus) |
| 313 | [x] | `Weak` | `Suy Yếu` | Ground Dragon (100065-r) |
| 314 | [x] | `Weaken` | `Làm Suy Yếu` | Choze (100095-sr), Choze (100095-ssr), Fukegao (100084-sr), Funeral Suspenders (100033-r), G4 (100119-ssr), Geryuganshoop (100059-ssrplus), Gouketsu (100089-ur), Ground Dragon (100065-r), Hamukichi (100148-sr), Jet Niceguy (100050-r), Messenger of the Seafolk (100034-sr), Metal Knight (100075-ssr) … (+3) |
| 315 | [x] | `Weakened` | `Đã Suy Yếu` | Metal Knight (100075-ssr) |
| 316 | [x] | `Wild` | `Cuồng Dã` | Carnage Kabuto (100156-ssrplus) |
| 317 | [x] | `Wild Follow-up` | `Truy Kích Cuồng Dã` | Carnage Kabuto (100302-ur) |
| 318 | [x] | `Wrath` | `Phẫn Nộ` | Tatsumaki/Terrible Tornado (100180-ur), Tatsumaki/Terrible Tornado (100180-urplus) |

## 2. Tên nhân vật (177 mục)

| STT | Đã chốt | ID | Bậc | Tên EN hiện tại | Tên VI hiện tại | Tên Việt bạn chốt |
|---:|:---:|---|:---:|---|---|---|
| 1 | [x] | `100029-urplus` | UR+ | Amai Mask | Amai Mask | Mặt Nạ Ngọt Ngào |
| 2 | [x] | `100313-urplus` | UR+ | Atomic Samurai | Atomic Samurai | Samurai Nguyên Tử |
| 3 | [x] | `100315-urplus` | UR+ | Bang & Bomb | Bang & Bomb | Bang & Bomb |
| 4 | [x] | `blacksperm-urplus` | UR+ | Black Sperm | Tinh TrÃ¹ng Äen | Tinh Trùng Đen |
| 5 | [x] | `100184-urplus` | UR+ | Boros | Boros | Boros |
| 6 | [x] | `100314-urplus` | UR+ | G5 | G5 | G5 |
| 7 | [x] | `100308-urplus` | UR+ | Genos | Genos | Genos |
| 8 | [x] | `100312-urplus` | UR+ | Nyan | Nyan | Nyan |
| 9 | [x] | `100316-urplus` | UR+ | Overgrown Rover | Overgrown Rover | Overgrown Rover |
| 10 | [x] | `100180-urplus` | UR+ | Tatsumaki/Terrible Tornado | Tatsumaki/Terrible Tornado | Lốc Xoáy Kinh Hoàng|
| 11 | [x] | `100013-urplus` | UR+ | Zombieman | Zombieman | Zombieman |
| 12 | [x] | `100188-ur` | UR | Atomic Samurai | Atomic Samurai | Samurai Nguyên Tử |
| 13 | [x] | `100186-ur` | UR | Bom/Bengpu | Bom/Bengpu | Bomb/Bengpu |
| 14 | [x] | `100184-ur` | UR | Boros | Boros | Boros |
| 15 | [x] | `100302-ur` | UR | Carnage Kabuto | Carnage Kabuto | Hung Thần Kabuto |
| 16 | [x] | `100045-ur` | UR | Child Emperor | Child Emperor | Đồng Đế |
| 17 | [x] | `100003-ur` | UR | Deep Sea King | Deep Sea King | Vua Biển Sâu |
| 18 | [x] | `100044-ur` | UR | Drive Knight | Drive Knight | Hiệp Sĩ Cơ động |
| 19 | [x] | `100010-ur` | UR | Flashy Flash | Flashy Flash | Tia Chớp Chói Lóa |
| 20 | [x] | `100182-ur` | UR | G4 | G4 | G4 |
| 21 | [x] | `100189-ur` | UR | Gale Wind | Gale Wind | Gale Wind |
| 22 | [x] | `100094-ur` | UR | Garou | Garou | Garou |
| 23 | [x] | `100192-ur` | UR | Genos | Genos | Genos |
| 24 | [x] | `100089-ur` | UR | Gouketsu | Gouketsu | Gouketsu |
| 25 | [x] | `100109-ur` | UR | Gyoro-Gyoro | Gyoro-Gyoro | Gyoro-Gyoro |
| 26 | [x] | `100191-ur` | UR | Hellfire Flame | Hellfire Flame | Hellfire Flame |
| 27 | [x] | `100009-ur` | UR | Hellish Blizzard | Hellish Blizzard | Bão Tuyết Địa Ngục |
| 28 | [x] | `100187-ur` | UR | King | King | King |
| 29 | [x] | `100190-ur` | UR | Melzargard | Melzargard | Melzargard |
| 30 | [x] | `100185-ur` | UR | Metal Bat | Metal Bat | Chày Sắt |
| 31 | [x] | `100157-ur` | UR | Metal Bat V2 | Metal Bat V2 | Chày Sắt V2 |
| 32 | [x] | `100008-ur` | UR | Mosquito Girl | Mosquito Girl | Cô Gái Muỗi |
| 33 | [x] | `100057-ur` | UR | Pig God | Pig God | Thần Heo |
| 34 | [x] | `100002-ur` | UR | Sonic V1 | Sonic V1 | Sonic Siêu Thanh V1 |
| 35 | [x] | `100069-ur` | UR | Sonic V2 | Sonic V2 | Sonic Siêu Thanh V2 |
| 36 | [x] | `100017-ur` | UR | Subterranean King | Subterranean King | Vua Lòng Đất |
| 37 | [x] | `100183-ur` | UR | Suiryu | Suiryu | Suiryu |
| 38 | [x] | `100180-ur` | UR | Tatsumaki/Terrible Tornado | Tatsumaki/Terrible Tornado | Lốc Xoáy Kinh Hoàng |
| 39 | [x] | `100013-ur` | UR | Zombieman | Zombieman | Zombieman |
| 40 | [x] | `100011-ssrplus` | SSR+ | Atomic Samurai | Atomic Samurai | Samurai Nguyên Tử |
| 41 | [x] | `100024-ssrplus` | SSR+ | Bang | Bang | Bang |
| 42 | [x] | `100055-ssrplus` | SSR+ | Boros | Boros | Boros |
| 43 | [x] | `100156-ssrplus` | SSR+ | Carnage Kabuto | Carnage Kabuto | Hung Thần Kabuto |
| 44 | [x] | `100045-ssrplus` | SSR+ | Child Emperor | Child Emperor | Đồng Đế |
| 45 | [x] | `100003-ssrplus` | SSR+ | Deep Sea King | Deep Sea King | Vua Biển Sâu |
| 46 | [x] | `100044-ssrplus` | SSR+ | Drive Knight | Drive Knight | Hiệp Sĩ Cơ động |
| 47 | [x] | `100010-ssrplus` | SSR+ | Flashy Flash | Flashy Flash | Tia Chớp Chói Lóa |
| 48 | [x] | `100094-ssrplus` | SSR+ | Garou | Garou | Garou |
| 49 | [x] | `100059-ssrplus` | SSR+ | Geryuganshoop | Geryuganshoop | Geryuganshoop |
| 50 | [x] | `100089-ssrplus` | SSR+ | Gouketsu | Gouketsu | Gouketsu |
| 51 | [x] | `100062-ssrplus` | SSR+ | Groribas | Groribas | Groribas |
| 52 | [x] | `100109-ssrplus` | SSR+ | Gyoro-Gyoro | Gyoro-Gyoro | Gyoro-Gyoro |
| 53 | [x] | `100056-ssrplus` | SSR+ | King | King | King |
| 54 | [x] | `100054-ssrplus` | SSR+ | Melzargard | Melzargard | Melzargard |
| 55 | [x] | `100012-ssrplus` | SSR+ | Metal Bat | Metal Bat | Chày Sắt |
| 56 | [x] | `100075-ssrplus` | SSR+ | Metal Knight | Metal Knight | Hiệp Sĩ Kim Loại |
| 57 | [x] | `100092-ssrplus` | SSR+ | Monsterized Bakuzan | Monsterized Bakuzan | Bakuzan Quái Nhân |
| 58 | [x] | `100103-ssrplus` | SSR+ | Phoenix Man | Phoenix Man | Phượng Hoàng |
| 59 | [x] | `100057-ssrplus` | SSR+ | Pig God | Pig God | Thần Heo |
| 60 | [x] | `100006-ssrplus` | SSR+ | Puri-Puri Prisoner | Puri-Puri Prisoner | Tù Nhân Du Hí |
| 61 | [x] | `100017-ssrplus` | SSR+ | Subterranean King | Subterranean King | Vua Lòng Đất |
| 62 | [x] | `100027-ssrplus` | SSR+ | Superalloy Darkshine | Superalloy Darkshine | Hợp Kim Đen Bóng |
| 63 | [x] | `100028-ssrplus` | SSR+ | Tank Top Master | Tank Top Master | Cao Thủ Ba Lỗ |
| 64 | [x] | `100025-ssrplus` | SSR+ | Watchdog Man | Watchdog Man | Người Chó Canh |
| 65 | [x] | `100013-ssrplus` | SSR+ | Zombieman | Zombieman | Zombieman |
| 66 | [x] | `100029-ssr` | SSR | Amai Mask | Amai Mask | Mặt Nạ Ngọt Ngào  |
| 67 | [x] | `100011-ssr` | SSR | Atomic Samurai | Atomic Samurai | Samurai Nguyên Tử |
| 68 | [x] | `100024-ssr` | SSR | Bang | Bang | Bang |
| 69 | [x] | `100108-ssr` | SSR | Bom/Bengpu | Bom/Bengpu | Bomb/Bengpu |
| 70 | [x] | `100055-ssr` | SSR | Boros | Boros | Boros |
| 71 | [x] | `100043-ssr` | SSR | Carnage Kabuto | Carnage Kabuto | Hung Thần Kabuto |
| 72 | [x] | `100045-ssr` | SSR | Child Emperor | Child Emperor | Đồng Đế |
| 73 | [x] | `100095-ssr` | SSR | Choze | Choze | Choze |
| 74 | [x] | `100003-ssr` | SSR | Deep Sea King | Deep Sea King | Vua Biển Sâu |
| 75 | [x] | `100044-ssr` | SSR | Drive Knight | Drive Knight | Hiệp Sĩ Cơ Động |
| 76 | [x] | `100149-ssr` | SSR | Eyesight | Eyesight | Eyesight |
| 77 | [x] | `100010-ssr` | SSR | Flashy Flash | Flashy Flash | Tia Chớp Chói Lóa |
| 78 | [x] | `100119-ssr` | SSR | G4 | G4 | G4 |
| 79 | [x] | `100126-ssr` | SSR | Gale Wind | Gale Wind | Gale Wind  |
| 80 | [x] | `100094-ssr` | SSR | Garou | Garou | Garou |
| 81 | [x] | `100074-ssr` | SSR | Genos | Genos | Genos |
| 82 | [x] | `100059-ssr` | SSR | Geryuganshoop | Geryuganshoop | Geryuganshoop |
| 83 | [x] | `100089-ssr` | SSR | Gouketsu | Gouketsu | Gouketsu |
| 84 | [x] | `100062-ssr` | SSR | Groribas | Groribas | Groribas |
| 85 | [x] | `100109-ssr` | SSR | Gyoro-Gyoro | Gyoro-Gyoro | Gyoro-Gyoro |
| 86 | [x] | `100125-ssr` | SSR | Hellfire Flame | Hellfire Flame | Hellfire Flame |
| 87 | [x] | `100009-ssr` | SSR | Hellish Blizzard | Hellish Blizzard | Bão Tuyết Địa Ngục |
| 88 | [x] | `100056-ssr` | SSR | King | King | King |
| 89 | [x] | `100054-ssr` | SSR | Melzargard | Melzargard | Melzargard |
| 90 | [x] | `100012-ssr` | SSR | Metal Bat | Metal Bat | Chày Sắt |
| 91 | [x] | `100075-ssr` | SSR | Metal Knight | Metal Knight | Hiệp Sĩ Kim Loại |
| 92 | [x] | `100008-ssr` | SSR | Mosquito Girl | Mosquito Girl | Cô Gái Muỗi |
| 93 | [x] | `100103-ssr` | SSR | Phoenix Man | Phoenix Man | Phượng Hoàng |
| 94 | [x] | `100057-ssr` | SSR | Pig God | Pig God | Thần Heo |
| 95 | [x] | `100006-ssr` | SSR | Puri-Puri Prisoner | Puri-Puri Prisoner | Tù Nhân Du Hí |
| 96 | [x] | `100002-ssr` | SSR | Speed-o-Sound Sonic V1 | Speed-o-Sound Sonic V1 | Sonic Siêu Thanh V1 |
| 97 | [x] | `100069-ssr` | SSR | Speed-o-Sound Sonic V2 | Speed-o-Sound Sonic V2 | Sonic Siêu Thanh V2 |
| 98 | [x] | `100017-ssr` | SSR | Subterranean King | Subterranean King | Vua Lòng Đất |
| 99 | [x] | `100090-ssr` | SSR | Suiryu | Suiryu | Suiryu |
| 100 | [x] | `100027-ssr` | SSR | Superalloy Darkshine | Superalloy Darkshine | Hợp Kim Đen Bóng |
| 101 | [x] | `100028-ssr` | SSR | Tank Top Master | Tank Top Master | Cao Thủ Ba Lỗ |
| 102 | [x] | `100004-ssr` | SSR | Tatsumaki/Terrible Tornado V1 | Tatsumaki/Terrible Tornado V1 | Lốc Xoáy Kinh Hoàng V1 |
| 103 | [x] | `100151-ssr` | SSR | Tatsumaki/Terrible Tornado V2 | Tatsumaki/Terrible Tornado V2 | Lốc Xoáy Kinh Hoàng V2 |
| 104 | [x] | `100060-ssr` | SSR | Vaccine Man V1 | Vaccine Man V1 | Vaccine Man V1 |
| 105 | [x] | `100085-ssr` | SSR | Vaccine Man V2 | Vaccine Man V2 | Vaccine Man V2 |
| 106 | [x] | `100025-ssr` | SSR | Watchdog Man | Watchdog Man | Người Chó Canh |
| 107 | [x] | `100013-ssr` | SSR | Zombieman | Zombieman | Zombieman |
| 108 | [x] | `100029-sr` | SR | Amai Mask | Amai Mask | Mặt Nạ Ngọt Ngào |
| 109 | [x] | `100047-sr` | SR | Armored Gorilla | Armored Gorilla | Khỉ Đột Bọc Giáp |
| 110 | [x] | `100135-sr` | SR | Awakened Cockroach | Awakened Cockroach | Gián Thức Tỉnh |
| 111 | [x] | `100092-sr` | SR | Bakuzan | Bakuzan | Bakuzan |
| 112 | [x] | `100049-sr` | SR | Beast King | Beast King | Vua Thú |
| 113 | [x] | `100046-sr` | SR | Blue Fire | Blue Fire | Lửa Xanh |
| 114 | [x] | `100096-sr` | SR | Bushidoriru | Bushidoriru | Bushidoriru |
| 115 | [x] | `100154-sr` | SR | Butterfly DX | Butterfly DX | Bướm DX |
| 116 | [x] | `100095-sr` | SR | Choze | Choze | Choze |
| 117 | [x] | `100136-sr` | SR | Death Gatling | Death Gatling | Gatling Tử Thần |
| 118 | [x] | `100083-sr` | SR | Doctor Genus | Doctor Genus | Tiến Sĩ Genus |
| 119 | [x] | `100111-sr` | SR | Face Ripper | Face Ripper | Kẻ Xé Mặt |
| 120 | [x] | `100097-sr` | SR | Fist Fight Djinn | Fist Fight Djinn | Ma Thần Quyền Đấu |
| 121 | [x] | `100084-sr` | SR | Fukegao | Fukegao | Fukegao |
| 122 | [x] | `100001-sr` | SR | Genos | Genos | Genos |
| 123 | [x] | `100015-sr` | SR | Golden Ball | Golden Ball | Bi Vàng |
| 124 | [x] | `100007-sr` | SR | Hammerhead | Hammerhead | Đầu Búa |
| 125 | [x] | `100148-sr` | SR | Hamukichi | Hamukichi | Hamukichi |
| 126 | [x] | `100110-sr` | SR | Heavy Tank Loincloth | Heavy Tank Loincloth | Khố Xe Tăng Hạng Nặng |
| 127 | [x] | `100009-sr` | SR | Hellish Blizzard | Hellish Blizzard | Bão Tuyết Địa Ngục |
| 128 | [x] | `100018-sr` | SR | Iairon | Iairon | Iairon |
| 129 | [x] | `100063-sr` | SR | Konbu Infinity | Konbu Infinity | Rong Biển |
| 130 | [x] | `100051-sr` | SR | Lightning Genji | Lightning Genji | Genji Sấm Sét |
| 131 | [x] | `100005-sr` | SR | Lightning Max | Lightning Max | Max Chân Điện |
| 132 | [x] | `100091-sr` | SR | Magicman | Magicman | Ảo Thuật Gia |
| 133 | [x] | `100034-sr` | SR | Messenger of the Seafolk | Messenger of the Seafolk | Sứ Giả Biển Sâu
| 134 | [x] | `100008-sr` | SR | Mosquito Girl | Mosquito Girl | Cô Gái Muỗi |
| 135 | [x] | `100120-sr` | SR | Rinrin | Rinrin | Rinrin |
| 136 | [x] | `100061-sr` | SR | Sky King | Sky King | Vua Bầu Trời |
| 137 | [x] | `100019-sr` | SR | Smile Man | Smile Man | Smile Man |
| 138 | [x] | `100030-sr` | SR | Snek | Snek | Snek |
| 139 | [x] | `100016-sr` | SR | Spring Mustachio | Spring Mustachio | Ria Mép Mùa Xuân |
| 140 | [x] | `100014-sr` | SR | Stinger | Stinger | Stinger |
| 141 | [x] | `100086-sr` | SR | Subterranean | Subterranean | Người Lòng Đất |
| 142 | [x] | `100104-sr` | SR | Tank Top Vegan | Tank Top Vegan | Ba Lỗ Ăn Chay |
| 143 | [x] | `100038-r` | R | Bunbun Man | Bunbun Man | Bunbun Man |
| 144 | [x] | `100039-r` | R | Crablante | Crablante | Cua Càng Bựa |
| 145 | [x] | `100068-r` | R | Dark Matter Thief | Dark Matter Thief | Dark Matter Thief |
| 146 | [x] | `100032-r` | R | D-pad | D-pad | D-pad |
| 147 | [x] | `100021-r` | R | Eyelashes | Eyelashes | Mi Mắt |
| 148 | [x] | `100033-r` | R | Funeral Suspenders | Funeral Suspenders | Funeral Suspenders |
| 149 | [x] | `100065-r` | R | Ground Dragon | Ground Dragon | Chuột Chũi |
| 150 | [x] | `100050-r` | R | Jet Niceguy | Jet Niceguy | Đấm Bốc |
| 151 | [x] | `100064-r` | R | Kamakyuri | Kamakyuri | Kamakyuri |
| 152 | [x] | `100106-r` | R | Maiko Plasma | Maiko Plasma | Maiko Plasma |
| 153 | [x] | `100031-r` | R | Mumen Rider | Mumen Rider | Xe đạp Thầm lặng|
| 154 | [x] | `100093-r` | R | Sourface | Sourface | Sourface |
| 155 | [x] | `100035-r` | R | Tank Top Blackhole | Tank Top Blackhole | Hố Đen Ba Lỗ |
| 156 | [x] | `100041-r` | R | Tank Top Tiger | Tank Top Tiger | Hổ Ba Lỗ |
| 157 | [x] | `100020-r` | R | Triple-Staff Lilly | Triple-Staff Lilly | Lily |
| 158 | [x] | `100036-r` | R | Wild Monkey | Wild Monkey | Khỉ Hoang |
| 159 | [x] | `100053-r` | R | YO649Z Mk. II | YO649Z Mk. II | YO649Z Mk. II |
| 160 | [x] | `100042-n` | N | Allback-man | Allback-man | Allback-man |
| 161 | [x] | `100067-n` | N | Charanko | Charanko | Charanko |
| 162 | [x] | `200007-n` | N | Clone | Clone | Bản Sao |
| 163 | [x] | `200010-n` | N | Deep Sea Destroyer | Deep Sea Destroyer | Kẻ Hủy Diệt Biển Sâu |
| 164 | [x] | `200033-n` | N | Deep Sea Invader | Deep Sea Invader | Kẻ Xâm Lược Biển Sâu |
| 165 | [x] | `200031-n` | N | Deep Sea Ravager | Deep Sea Ravager | Kẻ Tàn Phá Biển Sâu |
| 166 | [x] | `200008-n` | N | Don Pacino | Don Pacino | Don Pacino |
| 167 | [x] | `100022-n` | N | Frog Man | Frog Man | Người Ếch |
| 168 | [x] | `200013-n` | N | Men's Esthetician Man | Men's Esthetician Man | Men's Esthetician Man |
| 169 | [x] | `200001-n` | N | Paradiser Footsoldier | Paradiser Footsoldier | Bộ Binh  |
| 170 | [x] | `200026-n` | N | Paradiser Thug | Paradiser Thug | Côn Đồ |
| 171 | [x] | `200030-n` | N | Paradiser Trooper | Paradiser Trooper | Binh Sĩ  |
| 172 | [x] | `200009-n` | N | Skyfolk Raider | Skyfolk Raider | Kẻ Đột Kích Tộc Trời |
| 173 | [x] | `200018-n` | N | Skyfolk Rogue | Skyfolk Rogue | Đạo Tặc Tộc Trời |
| 174 | [x] | `200017-n` | N | Skyfolk Striker | Skyfolk Striker | Chiến Binh Tấn Công Tộc Trời |
| 175 | [x] | `100023-n` | N | Slugrus | Slugrus | Slugrus |
| 176 | [x] | `200011-n` | N | Subterranean Brute | Subterranean Brute | Kẻ Hung Bạo Lòng Đất |
| 177 | [x] | `200027-n` | N | Subterranean Champion | Subterranean Champion | Nhà Vô Địch Lòng Đất |

## Ghi chú sau khi hoàn tất

- Không xóa các dòng chưa muốn sửa; để trống cột Việt là được.
- Có thể chốt từng nhóm rồi yêu cầu Codex áp dụng từng phần.
- Khi áp dụng, cần cập nhật cả dữ liệu kỹ năng, chú thích hiệu ứng, tên nhân vật và kiểm thử song ngữ.
