import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { getSql } from './database.js'

const require = createRequire(import.meta.url)
const charactersVi = require('../../src/data/characters.json')
const charactersEn = require('../../src/data/characters_en.json')
const events = require('../../src/data/events.json')

let adminSchemaPromise

const releaseSeeds = [
  ['CN', '2026-06-01', '100316-urplus', '/Characters/Full_Background/Rover_URplus.png', false, 1],
  ['CN', '2026-06-15', '100314-urplus', '/Characters/Full_Background/G5_URplus.png', true, 2],
  ['SEA', '2026-06-01', '100312-urplus', '/Characters/Full_Background/Nyan_URplus.png', false, 1],
  ['SEA', '2026-06-15', '100029-urplus', '/Characters/Full_Background/Amai_Mask_Urplus.png', true, 2],
  ['CN', '2026-07-01', '100013-urplus', '/Characters/Full_Background/ZombIeMan_URplus.png', false, 1],
  ['CN', '2026-07-15', '100315-urplus', '/Characters/Full_Background/Bang&Bomb_Urplus.png', true, 2],
  ['SEA', '2026-07-01', '100313-urplus', '/Characters/Full_Background/Atomic Samurai_URplus.png', false, 1],
  ['SEA', '2026-07-15', '100180-urplus', '/Characters/Full_Background/Tatsumaki_URplus.png', true, 2],
  ['CN', '2026-08-01', 'unknown', '/Characters/Full_Background/Nhan_Vat_Bi_An.jpg', false, 1,
    'Nhân Vật Bí Ẩn', 'Mystery Character', 'UR+', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN',
    'Sức Mạnh Tiềm Ẩn', 'Hidden Potential'],
  ['CN', '2026-08-15', '100316-urplus', '/Characters/Full_Background/Rover_URplus.png', true, 2],
  ['SEA', '2026-08-01', '100314-urplus', '/Characters/Full_Background/G5_URplus.png', false, 1],
  ['SEA', '2026-08-15', '100312-urplus', '/Characters/Full_Background/Nyan_URplus.png', true, 2],
].map(([
  server, date, characterId, bannerImage, isReturn, sortOrder,
  overrideNameVi = '', overrideNameEn = '', overrideTier = '',
  overrideFactionVi = '', overrideFactionEn = '', overrideTypeVi = '', overrideTypeEn = '',
  overrideRoleVi = '', overrideRoleEn = '',
]) => ({
  server, date, characterId, bannerImage, isReturn, sortOrder,
  overrideNameVi, overrideNameEn, overrideTier, overrideFactionVi, overrideFactionEn,
  overrideTypeVi, overrideTypeEn, overrideRoleVi, overrideRoleEn,
}))

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS characters (
    "Id" varchar(80) PRIMARY KEY,
    "NameVi" varchar(200) NOT NULL,
    "NameEn" varchar(200) NOT NULL,
    "ImageUrl" varchar(500) NOT NULL,
    "Tier" varchar(20) NOT NULL,
    "TypeVi" varchar(100) NOT NULL,
    "TypeEn" varchar(100) NOT NULL,
    "FactionVi" varchar(100) NOT NULL,
    "FactionEn" varchar(100) NOT NULL,
    "RolesVi" text[] NOT NULL DEFAULT '{}',
    "RolesEn" text[] NOT NULL DEFAULT '{}',
    "DuyenVi" text NOT NULL DEFAULT '',
    "DuyenEn" text NOT NULL DEFAULT '',
    "BioVi" text NOT NULL DEFAULT '',
    "BioEn" text NOT NULL DEFAULT '',
    "KeepsakeIcon" varchar(500),
    "TraitsVi" text[] NOT NULL DEFAULT '{}',
    "TraitsEn" text[] NOT NULL DEFAULT '{}',
    "BondListVi" text NOT NULL DEFAULT '',
    "BondListEn" text NOT NULL DEFAULT '',
    "ClassLevel" varchar(80) NOT NULL DEFAULT '',
    "ReleaseSea" date,
    "ReleaseChina" date,
    base_atk integer NOT NULL DEFAULT 0 CHECK (base_atk >= 0),
    base_hp integer NOT NULL DEFAULT 0 CHECK (base_hp >= 0),
    base_def integer NOT NULL DEFAULT 0 CHECK (base_def >= 0),
    base_spd integer NOT NULL DEFAULT 0 CHECK (base_spd >= 0),
    pvp_atk integer NOT NULL DEFAULT 0 CHECK (pvp_atk >= 0),
    pvp_hp integer NOT NULL DEFAULT 0 CHECK (pvp_hp >= 0),
    pvp_def integer NOT NULL DEFAULT 0 CHECK (pvp_def >= 0),
    pvp_spd integer NOT NULL DEFAULT 0 CHECK (pvp_spd >= 0),
    "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "IX_characters_NameVi" ON characters ("NameVi")`,
  `CREATE INDEX IF NOT EXISTS "IX_characters_NameEn" ON characters ("NameEn")`,
  `CREATE TABLE IF NOT EXISTS character_skills (
    "Id" uuid PRIMARY KEY,
    "CharacterId" varchar(80) NOT NULL REFERENCES characters ("Id") ON DELETE CASCADE,
    "SortOrder" integer NOT NULL,
    "NameVi" varchar(200) NOT NULL,
    "NameEn" varchar(200) NOT NULL,
    "DescriptionVi" text NOT NULL DEFAULT '',
    "DescriptionEn" text NOT NULL DEFAULT '',
    "TypeVi" varchar(100) NOT NULL DEFAULT '',
    "TypeEn" varchar(100) NOT NULL DEFAULT '',
    "IconUrl" varchar(500),
    "AnimationUrl" varchar(500),
    "KeepsakeIconUrl" varchar(500)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "IX_character_skills_CharacterId_SortOrder"
    ON character_skills ("CharacterId", "SortOrder")`,
  `CREATE TABLE IF NOT EXISTS character_effects (
    "Id" uuid PRIMARY KEY,
    "CharacterId" varchar(80) NOT NULL REFERENCES characters ("Id") ON DELETE CASCADE,
    "SortOrder" integer NOT NULL,
    "TermVi" varchar(200) NOT NULL,
    "TermEn" varchar(200) NOT NULL,
    "DescriptionVi" text NOT NULL DEFAULT '',
    "DescriptionEn" text NOT NULL DEFAULT ''
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "IX_character_effects_CharacterId_SortOrder"
    ON character_effects ("CharacterId", "SortOrder")`,
  `CREATE TABLE IF NOT EXISTS events (
    "Id" varchar(100) PRIMARY KEY,
    "TitleVi" varchar(300) NOT NULL,
    "TitleEn" varchar(300) NOT NULL,
    "DescriptionVi" text NOT NULL DEFAULT '',
    "DescriptionEn" text NOT NULL DEFAULT '',
    "Category" varchar(50) NOT NULL DEFAULT 'main',
    "ImageUrl" varchar(500) NOT NULL DEFAULT '',
    "DetailImages" text[] NOT NULL DEFAULT '{}',
    "SectionsJson" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "StartDate" date NOT NULL,
    "EndDate" date NOT NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT events_date_order CHECK ("EndDate" >= "StartDate")
  )`,
  `CREATE INDEX IF NOT EXISTS "IX_events_StartDate_EndDate" ON events ("StartDate", "EndDate")`,
  `CREATE TABLE IF NOT EXISTS release_schedule (
    "Id" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "Server" varchar(10) NOT NULL CHECK ("Server" IN ('CN', 'SEA')),
    "Date" date NOT NULL,
    "CharacterId" varchar(80) NOT NULL,
    "BannerImage" varchar(500) NOT NULL DEFAULT '',
    "IsReturn" boolean NOT NULL DEFAULT false,
    "OverrideNameVi" varchar(200) NOT NULL DEFAULT '',
    "OverrideNameEn" varchar(200) NOT NULL DEFAULT '',
    "OverrideTier" varchar(20) NOT NULL DEFAULT '',
    "OverrideFactionVi" varchar(100) NOT NULL DEFAULT '',
    "OverrideFactionEn" varchar(100) NOT NULL DEFAULT '',
    "OverrideTypeVi" varchar(100) NOT NULL DEFAULT '',
    "OverrideTypeEn" varchar(100) NOT NULL DEFAULT '',
    "OverrideRoleVi" varchar(200) NOT NULL DEFAULT '',
    "OverrideRoleEn" varchar(200) NOT NULL DEFAULT '',
    "SortOrder" integer NOT NULL CHECK ("SortOrder" BETWEEN 0 AND 100),
    "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "IX_release_schedule_Date_Server_SortOrder"
    ON release_schedule ("Date", "Server", "SortOrder")`,
]

const normalizeList = (value) => Array.isArray(value)
  ? [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))]
  : []

const parseDate = (value) => {
  const text = String(value || '').trim()
  if (!text) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : null
}

const statsOf = (value = {}) => ({
  atk: Math.max(0, Number(value.atk) || 0),
  hp: Math.max(0, Number(value.hp) || 0),
  def: Math.max(0, Number(value.def) || 0),
  spd: Math.max(0, Number(value.spd) || 0),
})

const stableUuid = (value) => {
  const hex = createHash('sha256').update(value).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

const characterSeeds = charactersVi.map((vi, index) => {
  const en = charactersEn.find((item) => item.id === vi.id) || charactersEn[index] || {}
  const base = statsOf(vi.baseStats)
  const pvp = statsOf(vi.pvpStats)
  return {
    id: String(vi.id || '').trim(),
    nameVi: String(vi.name || '').trim(),
    nameEn: String(en.name || vi.name || '').trim(),
    imageUrl: String(vi.imageURL || '').trim(),
    tier: String(vi.tier || '').trim(),
    typeVi: String(vi.type || '').trim(),
    typeEn: String(en.type || vi.type || '').trim(),
    factionVi: String(vi.faction || '').trim(),
    factionEn: String(en.faction || vi.faction || '').trim(),
    rolesVi: normalizeList(vi.roles),
    rolesEn: normalizeList(en.roles),
    duyenVi: String(vi.duyen || '').trim(),
    duyenEn: String(en.duyen || vi.duyen || '').trim(),
    bioVi: String(vi.bio || '').trim(),
    bioEn: String(en.bio || vi.bio || '').trim(),
    keepsakeIcon: String(vi.keepsakeIcon || '').trim() || null,
    traitsVi: normalizeList(vi.dacTinh),
    traitsEn: normalizeList(en.dacTinh),
    bondListVi: String(vi.bondList || '').trim(),
    bondListEn: String(en.bondList || vi.bondList || '').trim(),
    classLevel: String(vi.classLevel || vi.class || '').trim(),
    releaseSea: parseDate(vi.releaseSea),
    releaseChina: parseDate(vi.releaseTrung),
    baseAtk: base.atk, baseHp: base.hp, baseDef: base.def, baseSpd: base.spd,
    pvpAtk: pvp.atk, pvpHp: pvp.hp, pvpDef: pvp.def, pvpSpd: pvp.spd,
  }
}).filter((item) => item.id && item.nameVi && item.nameEn && item.tier && item.typeVi && item.typeEn && item.factionVi && item.factionEn)

const characterSkillSeeds = charactersVi.flatMap((vi, characterIndex) => {
  const en = charactersEn.find((item) => item.id === vi.id) || charactersEn[characterIndex] || {}
  return (vi.skills || []).map((skill, sortOrder) => {
    const translated = en.skills?.[sortOrder] || skill
    return {
      id: stableUuid(`${vi.id}:skill:${sortOrder}`),
      characterId: vi.id,
      sortOrder,
      nameVi: String(skill.name || '').trim(),
      nameEn: String(translated.name || skill.name || '').trim(),
      descriptionVi: String(skill.desc || '').trim(),
      descriptionEn: String(translated.desc || skill.desc || '').trim(),
      typeVi: String(skill.type || '').trim(),
      typeEn: String(translated.type || skill.type || '').trim(),
      iconUrl: String(skill.icon || '').trim() || null,
      animationUrl: String(skill.animation || skill.animationURL || skill.videoURL || '').trim() || null,
      keepsakeIconUrl: String(skill.keepsakeIcon || '').trim() || null,
    }
  }).filter((skill) => skill.nameVi && skill.nameEn)
})

const characterEffectSeeds = charactersVi.flatMap((vi, characterIndex) => {
  const en = charactersEn.find((item) => item.id === vi.id) || charactersEn[characterIndex] || {}
  return (vi.effects || []).map((effect, sortOrder) => {
    const translated = en.effects?.[sortOrder] || effect
    return {
      id: stableUuid(`${vi.id}:effect:${sortOrder}`),
      characterId: vi.id,
      sortOrder,
      termVi: String(effect.term || '').trim(),
      termEn: String(translated.term || effect.term || '').trim(),
      descriptionVi: String(effect.desc || '').trim(),
      descriptionEn: String(translated.desc || effect.desc || '').trim(),
    }
  }).filter((effect) => effect.termVi && effect.termEn)
})

const eventSeeds = events.map((event) => ({
  id: String(event.id || '').trim(),
  titleVi: String(event.titleVi || '').trim(),
  titleEn: String(event.titleEn || '').trim(),
  descriptionVi: String(event.descriptionVi || '').trim(),
  descriptionEn: String(event.descriptionEn || '').trim(),
  category: String(event.category || 'main').trim(),
  imageUrl: String(event.imageUrl || '').trim(),
  detailImages: normalizeList(event.detailImages),
  sectionsJson: event.sections || [],
  startDate: parseDate(event.startDate),
  endDate: parseDate(event.endDate),
})).filter((item) => item.id && item.titleVi && item.titleEn && item.startDate && item.endDate)

const seedCharacters = async (sql) => sql.query(
  `INSERT INTO characters (
     "Id", "NameVi", "NameEn", "ImageUrl", "Tier", "TypeVi", "TypeEn", "FactionVi", "FactionEn",
     "RolesVi", "RolesEn", "DuyenVi", "DuyenEn", "BioVi", "BioEn", "KeepsakeIcon",
     "TraitsVi", "TraitsEn", "BondListVi", "BondListEn", "ClassLevel", "ReleaseSea", "ReleaseChina",
     base_atk, base_hp, base_def, base_spd, pvp_atk, pvp_hp, pvp_def, pvp_spd)
   SELECT x.id, x."nameVi", x."nameEn", x."imageUrl", x.tier, x."typeVi", x."typeEn", x."factionVi", x."factionEn",
          x."rolesVi", x."rolesEn", x."duyenVi", x."duyenEn", x."bioVi", x."bioEn", x."keepsakeIcon",
          x."traitsVi", x."traitsEn", x."bondListVi", x."bondListEn", x."classLevel",
          x."releaseSea"::date, x."releaseChina"::date,
          x."baseAtk", x."baseHp", x."baseDef", x."baseSpd", x."pvpAtk", x."pvpHp", x."pvpDef", x."pvpSpd"
     FROM jsonb_to_recordset($1::jsonb) AS x(
       id text, "nameVi" text, "nameEn" text, "imageUrl" text, tier text,
       "typeVi" text, "typeEn" text, "factionVi" text, "factionEn" text,
       "rolesVi" text[], "rolesEn" text[], "duyenVi" text, "duyenEn" text,
       "bioVi" text, "bioEn" text, "keepsakeIcon" text, "traitsVi" text[], "traitsEn" text[],
       "bondListVi" text, "bondListEn" text, "classLevel" text, "releaseSea" text, "releaseChina" text,
       "baseAtk" integer, "baseHp" integer, "baseDef" integer, "baseSpd" integer,
       "pvpAtk" integer, "pvpHp" integer, "pvpDef" integer, "pvpSpd" integer)
   ON CONFLICT ("Id") DO NOTHING`,
  [JSON.stringify(characterSeeds)],
)

const seedEvents = async (sql) => sql.query(
  `INSERT INTO events (
     "Id", "TitleVi", "TitleEn", "DescriptionVi", "DescriptionEn", "Category", "ImageUrl",
     "DetailImages", "SectionsJson", "StartDate", "EndDate")
   SELECT x.id, x."titleVi", x."titleEn", x."descriptionVi", x."descriptionEn", x.category, x."imageUrl",
          x."detailImages", x."sectionsJson", x."startDate"::date, x."endDate"::date
     FROM jsonb_to_recordset($1::jsonb) AS x(
       id text, "titleVi" text, "titleEn" text, "descriptionVi" text, "descriptionEn" text,
       category text, "imageUrl" text, "detailImages" text[], "sectionsJson" jsonb,
       "startDate" text, "endDate" text)
   ON CONFLICT ("Id") DO NOTHING`,
  [JSON.stringify(eventSeeds)],
)

const seedCharacterSkills = async (sql) => sql.query(
  `INSERT INTO character_skills (
     "Id", "CharacterId", "SortOrder", "NameVi", "NameEn", "DescriptionVi", "DescriptionEn",
     "TypeVi", "TypeEn", "IconUrl", "AnimationUrl", "KeepsakeIconUrl")
   SELECT x.id::uuid, x."characterId", x."sortOrder", x."nameVi", x."nameEn",
          x."descriptionVi", x."descriptionEn", x."typeVi", x."typeEn", x."iconUrl",
          x."animationUrl", x."keepsakeIconUrl"
     FROM jsonb_to_recordset($1::jsonb) AS x(
       id text, "characterId" text, "sortOrder" integer, "nameVi" text, "nameEn" text,
       "descriptionVi" text, "descriptionEn" text, "typeVi" text, "typeEn" text,
       "iconUrl" text, "animationUrl" text, "keepsakeIconUrl" text)
   ON CONFLICT ("CharacterId", "SortOrder") DO NOTHING`,
  [JSON.stringify(characterSkillSeeds)],
)

const seedCharacterEffects = async (sql) => sql.query(
  `INSERT INTO character_effects (
     "Id", "CharacterId", "SortOrder", "TermVi", "TermEn", "DescriptionVi", "DescriptionEn")
   SELECT x.id::uuid, x."characterId", x."sortOrder", x."termVi", x."termEn",
          x."descriptionVi", x."descriptionEn"
     FROM jsonb_to_recordset($1::jsonb) AS x(
       id text, "characterId" text, "sortOrder" integer, "termVi" text, "termEn" text,
       "descriptionVi" text, "descriptionEn" text)
   ON CONFLICT ("CharacterId", "SortOrder") DO NOTHING`,
  [JSON.stringify(characterEffectSeeds)],
)

const seedReleases = async (sql) => sql.query(
  `INSERT INTO release_schedule (
     "Server", "Date", "CharacterId", "BannerImage", "IsReturn", "OverrideNameVi", "OverrideNameEn",
     "OverrideTier", "OverrideFactionVi", "OverrideFactionEn", "OverrideTypeVi", "OverrideTypeEn",
     "OverrideRoleVi", "OverrideRoleEn", "SortOrder")
   SELECT x.server, x.date::date, x."characterId", x."bannerImage", x."isReturn", x."overrideNameVi",
          x."overrideNameEn", x."overrideTier", x."overrideFactionVi", x."overrideFactionEn",
          x."overrideTypeVi", x."overrideTypeEn", x."overrideRoleVi", x."overrideRoleEn", x."sortOrder"
     FROM jsonb_to_recordset($1::jsonb) AS x(
       server text, date text, "characterId" text, "bannerImage" text, "isReturn" boolean,
       "overrideNameVi" text, "overrideNameEn" text, "overrideTier" text,
       "overrideFactionVi" text, "overrideFactionEn" text, "overrideTypeVi" text, "overrideTypeEn" text,
       "overrideRoleVi" text, "overrideRoleEn" text, "sortOrder" integer)
   ON CONFLICT ("Date", "Server", "SortOrder") DO NOTHING`,
  [JSON.stringify(releaseSeeds)],
)

export const initializeAdminSchema = async (sql, { seed = true } = {}) => {
  for (const statement of schemaStatements) await sql.query(statement)
  if (!seed) return
  const [counts] = await sql.query(
      `SELECT (SELECT COUNT(*) FROM characters) AS characters,
              (SELECT COUNT(*) FROM character_skills) AS "characterSkills",
              (SELECT COUNT(*) FROM character_effects) AS "characterEffects",
              (SELECT COUNT(*) FROM events) AS events,
              (SELECT COUNT(*) FROM release_schedule) AS releases`,
  )
  if (Number(counts?.characters || 0) === 0) await seedCharacters(sql)
  if (Number(counts?.characterSkills || 0) === 0) await seedCharacterSkills(sql)
  if (Number(counts?.characterEffects || 0) === 0) await seedCharacterEffects(sql)
  if (Number(counts?.events || 0) === 0) await seedEvents(sql)
  if (Number(counts?.releases || 0) === 0) await seedReleases(sql)
}

export const ensureAdminSchema = async () => {
  if (adminSchemaPromise) return adminSchemaPromise
  adminSchemaPromise = initializeAdminSchema(getSql()).catch((error) => {
    adminSchemaPromise = undefined
    throw error
  })
  return adminSchemaPromise
}

export const _resetAdminSchemaForTests = () => {
  adminSchemaPromise = undefined
}

export const adminSeedCounts = {
  characters: characterSeeds.length,
  characterSkills: characterSkillSeeds.length,
  characterEffects: characterEffectSeeds.length,
  events: eventSeeds.length,
  releases: releaseSeeds.length,
}
