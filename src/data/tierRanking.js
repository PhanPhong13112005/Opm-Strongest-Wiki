// BẢNG THỨ TỰ NHÂN VẬT
//
// Cách chỉnh:
// 1. Di chuyển cả dòng ID lên hoặc xuống trong đúng nhóm tier.
// 2. Dòng nằm trên sẽ có thứ hạng cao hơn.
// 3. Không đổi ID và không để một ID xuất hiện hai lần.
// 4. Tên sau dấu // chỉ là ghi chú để dễ nhận biết nhân vật.
//
// Trang Tier sẽ tự thêm nhân vật mới chưa có trong file vào cuối đúng nhóm.

export const TIER_ORDER = ['UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R', 'N']

export default {
  'UR+': [
    'blacksperm-urplus', // Tinh Trùng Đen
    '100013-urplus', // Zombieman
    '100316-urplus', // Overgrown Rover
    '100315-urplus', // Bang & Bomb
    '100314-urplus', // G5
    '100313-urplus', // Atomic Samurai
    '100312-urplus', // Nyan
    '100180-urplus', // Tatsumaki/Terrible Tornado
    '100029-urplus', // Amai Mask
    '100184-urplus', // Boros
    '100308-urplus', // Genos
  ],
  UR: [
    '100109-ur', // Gyoro-Gyoro
    '100157-ur', // Metal Bat V2
    '100069-ur', // Sonic V2
    '100094-ur', // Garou
    '100057-ur', // Pig God
    '100302-ur', // Carnage Kabuto
    '100017-ur', // Subterranean King
    '100044-ur', // Drive Knight
    '100009-ur', // Hellish Blizzard
    '100003-ur', // Deep Sea King
    '100013-ur', // Zombieman
    '100045-ur', // Child Emperor
    '100008-ur', // Mosquito Girl
    '100010-ur', // Flashy Flash
    '100089-ur', // Gouketsu
    '100192-ur', // Genos
    '100191-ur', // Hellfire Flame
    '100190-ur', // Melzargard
    '100189-ur', // Gale Wind
    '100188-ur', // Atomic Samurai
    '100187-ur', // King
    '100186-ur', // Bom/Bengpu
    '100185-ur', // Metal Bat
    '100184-ur', // Boros
    '100183-ur', // Suiryu
    '100182-ur', // G4
    '100002-ur', // Sonic V1
    '100180-ur', // Tatsumaki/Terrible Tornado
  ],
  'SSR+': [
    '100027-ssrplus', // Superalloy Darkshine
    '100075-ssrplus', // Metal Knight
    '100006-ssrplus', // Puri-Puri Prisoner
    '100013-ssrplus', // Zombieman
    '100062-ssrplus', // Groribas
    '100025-ssrplus', // Watchdog Man
    '100054-ssrplus', // Melzargard
    '100044-ssrplus', // Drive Knight
    '100028-ssrplus', // Tank Top Master
    '100003-ssrplus', // Deep Sea King
    '100017-ssrplus', // Subterranean King
    '100109-ssrplus', // Gyoro-Gyoro
    '100057-ssrplus', // Pig God
    '100010-ssrplus', // Flashy Flash
    '100089-ssrplus', // Gouketsu
    '100103-ssrplus', // Phoenix Man
    '100094-ssrplus', // Garou
    '100011-ssrplus', // Atomic Samurai
    '100024-ssrplus', // Bang
    '100059-ssrplus', // Geryuganshoop
    '100056-ssrplus', // King
    '100055-ssrplus', // Boros
    '100156-ssrplus', // Carnage Kabuto
    '100045-ssrplus', // Child Emperor
    '100012-ssrplus', // Metal Bat
    '100092-ssrplus', // Monsterized Bakuzan
  ],
  SSR: [
    '100029-ssr', // Amai Mask
    '100011-ssr', // Atomic Samurai
    '100024-ssr', // Bang
    '100108-ssr', // Bom/Bengpu
    '100055-ssr', // Boros
    '100043-ssr', // Carnage Kabuto
    '100045-ssr', // Child Emperor
    '100095-ssr', // Choze
    '100003-ssr', // Deep Sea King
    '100044-ssr', // Drive Knight
    '100010-ssr', // Flashy Flash
    '100119-ssr', // G4
    '100126-ssr', // Gale Wind
    '100149-ssr', // Eyesight
    '100094-ssr', // Garou
    '100074-ssr', // Genos
    '100059-ssr', // Geryuganshoop
    '100089-ssr', // Gouketsu
    '100062-ssr', // Groribas
    '100109-ssr', // Gyoro-Gyoro
    '100125-ssr', // Hellfire Flame
    '100009-ssr', // Hellish Blizzard
    '100056-ssr', // King
    '100054-ssr', // Melzargard
    '100012-ssr', // Metal Bat
    '100075-ssr', // Metal Knight
    '100008-ssr', // Mosquito Girl
    '100103-ssr', // Phoenix Man
    '100057-ssr', // Pig God
    '100006-ssr', // Puri-Puri Prisoner
    '100002-ssr', // Speed-o-Sound Sonic V1
    '100069-ssr', // Speed-o-Sound Sonic V2
    '100017-ssr', // Subterranean King
    '100090-ssr', // Suiryu
    '100027-ssr', // Superalloy Darkshine
    '100028-ssr', // Tank Top Master
    '100004-ssr', // Tatsumaki/Terrible Tornado V1
    '100151-ssr', // Tatsumaki/Terrible Tornado V2
    '100060-ssr', // Vaccine Man V1
    '100085-ssr', // Vaccine Man V2
    '100025-ssr', // Watchdog Man
    '100013-ssr', // Zombieman
  ],
  SR: [
    '100029-sr', // Amai Mask
    '100047-sr', // Armored Gorilla
    '100135-sr', // Awakened Cockroach
    '100092-sr', // Bakuzan
    '100049-sr', // Beast King
    '100046-sr', // Blue Fire
    '100096-sr', // Bushidoriru
    '100154-sr', // Butterfly DX
    '100095-sr', // Choze
    '100136-sr', // Death Gatling
    '100083-sr', // Doctor Genus
    '100111-sr', // Face Ripper
    '100097-sr', // Fist Fight Djinn
    '100084-sr', // Fukegao
    '100001-sr', // Genos
    '100015-sr', // Golden Ball
    '100007-sr', // Hammerhead
    '100148-sr', // Hamukichi
    '100110-sr', // Heavy Tank Loincloth
    '100009-sr', // Hellish Blizzard
    '100018-sr', // Iairon
    '100063-sr', // Konbu Infinity
    '100051-sr', // Lightning Genji
    '100005-sr', // Lightning Max
    '100091-sr', // Magicman
    '100034-sr', // Messenger of the Seafolk
    '100008-sr', // Mosquito Girl
    '100120-sr', // Rinrin
    '100061-sr', // Sky King
    '100019-sr', // Smile Man
    '100030-sr', // Snek
    '100016-sr', // Spring Mustachio
    '100014-sr', // Stinger
    '100086-sr', // Subterranean
    '100104-sr', // Tank Top Vegan
  ],
  R: [
    '100038-r', // Bunbun Man
    '100039-r', // Crablante
    '100032-r', // D-pad
    '100068-r', // Dark Matter Thief
    '100021-r', // Eyelashes
    '100033-r', // Funeral Suspenders
    '100065-r', // Ground Dragon
    '100050-r', // Jet Niceguy
    '100064-r', // Kamakyuri
    '100106-r', // Maiko Plasma
    '100031-r', // Mumen Rider
    '100093-r', // Sourface
    '100035-r', // Tank Top Blackhole
    '100041-r', // Tank Top Tiger
    '100020-r', // Triple-Staff Lilly
    '100036-r', // Wild Monkey
    '100053-r', // YO649Z Mk. II
  ],
  N: [
    '100042-n', // Allback-man
    '100067-n', // Charanko
    '200007-n', // Clone
    '200010-n', // Deep Sea Destroyer
    '200033-n', // Deep Sea Invader
    '200031-n', // Deep Sea Ravager
    '200008-n', // Don Pacino
    '100022-n', // Frog Man
    '200013-n', // Men's Esthetician Man
    '200001-n', // Paradiser Footsoldier
    '200026-n', // Paradiser Thug
    '200030-n', // Paradiser Trooper
    '200009-n', // Skyfolk Raider
    '200018-n', // Skyfolk Rogue
    '200017-n', // Skyfolk Striker
    '100023-n', // Slugrus
    '200011-n', // Subterranean Brute
    '200027-n', // Subterranean Champion
  ],
}
