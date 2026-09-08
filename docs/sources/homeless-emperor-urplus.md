# Homeless Emperor UR+ — source audit

SOURCE_URL=https://opm-ts-wiki.vercel.app/en/character-list
SOURCE_DETAIL_URL=https://opm-ts-wiki.vercel.app/en/character-info/100319-urplus
SOURCE_CHARACTER=Homeless Emperor UR+
SOURCE_CHARACTER_ID=100319-urplus
LOCAL_CHARACTER_ID=homeless-emperor-urplus
VERIFIED_ON=2026-09-07

## Fields filled from this source

- `type` / source label `SERIES`: `Esper` (`Tâm Linh` in the established Vietnamese catalog vocabulary).
- `faction`: `Monster` (`Quái Nhân` in the established Vietnamese catalog vocabulary).
- `Awaken Passive — A2`: the source proves the A2 tier split and its tier-specific values; full prose and terminology follow the owner-supplied game screenshots and correction.
- `Awaken Passive — A3`: `Restores 150 Energy Gauge when attacking.`; no additional A3 behavior was added.

## Owner-confirmed release metadata

- CN debut / `releaseTrung`: `01/09/2026`.
- CN comeback: `01/11/2026`.
- SEA debut / `releaseSea`: `01/01/2027`.
- SEA comeback: `01/03/2027`.
- The exact dates above supersede the source site's month-only debut display.

## Owner-confirmed class metadata

- Gameplay class / `duyen`: `Hyper-Sense Burst`.
- Disaster level / `classLevel`: `Dragon`.
- Canonical class icon: `/Class/Dragon.png` (exact repository case).
- Vietnamese role: `Gia Tốc Cực Hạn - Sức Mạnh Hủy Diệt`.
- Gameplay class and disaster level remain separate fields.

## Source metadata retained for audit only

- Rarity: `UR+`.
- Header tag/role: `Extreme Acceleration`.
- The page does not expose a separate class-level value or bond data; `classLevel` is supplied by the owner correction.
- The page shows a Keepsake marker for Ultra-Ultimate but does not expose a Keepsake name, standalone stats, or standalone effect text.

## Source conflicts with owner screenshots

- Basic: source says `No information yet.`; owner screenshot supplies `120% ATK` single-target DMG. Local screenshot value was retained.
- Ultimate ATK buff: source places `Raises the ATK of all allies by 30% (cannot be dispelled)` on both Ultimate and Ultra-Ultimate; owner screenshot identifies it as a Super Ultimate addition. Local screenshot placement was retained.
- Speed terminology: source uses `[Extreme Speed Boost]`; owner screenshot uses `[Extreme Speed-Up]`.
- Passive terminology: source uses `[Specialized Non-Crit DMG Free]`, `[Specialized Crit]`, `[Specialized Speed Up]`, `[Hyperspeed Field]`, and `[Energy Resilience]`; owner screenshot uses `[Specialized Non-Crit Hit DMG Reduction]`, `[Specialized Critical Hit]`, `[Specialized Speed-Up]`, `[normal Speed-Up]`, and `[Energy Tenacity]`. Local screenshot wording was retained.
- Awaken naming/mode: source uses `[Destructive Force - Invasion]`, `[Destructive Force - Resist]`, and `Arena only`; the owner correction requires canonical `[Destructive Momentum: Assault]`, `[Destructive Momentum: Defense]`, and `PVP only`. The owner terminology is used in public descriptions.

## Owner correction applied

- Vietnamese display name: `Vua Không Nhà`.
- Character catalog image: `/Characters/Homeless Emperor (URplus)/URplus.png`.
- Release-schedule banner: `/Characters/Full_Background/Homeless_Emperor_URplus.png`.
- The source website is used for Series, Faction, A1/A2/A3 separation, and the A3 fact; exact server release dates are owner-confirmed.
- Full Basic, Ultimate, Super Ultimate, Passive Base/5★ Gold/5★ Purple, A1, and A2 descriptions come from the owner-supplied game screenshots and correction.
- Public skill descriptions retain complete conditions, definitions, percentages, interactions, and tier-specific values; they are not replaced with source-site summaries.

## Deliberately not imported

- The profile paragraph is explicitly labelled `UNVERIFIED — from a forwarded leak, not the config database`; it was not imported as canonical character metadata.
- Bond data and Keepsake content remain unset because the page does not provide an exact compatible value.
