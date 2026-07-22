import { ensureAdminSchema } from './adminDatabase.js'
import { getSql } from './database.js'
import { bodyOf, json, methodNotAllowed, noContent, requireUser } from './http.js'

const text = (value) => String(value ?? '').trim()
const list = (value) => Array.isArray(value)
  ? [...new Set(value.map(text).filter(Boolean))]
  : []
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const dateValue = (value) => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

const isEnglish = (language) => String(language || '').toLowerCase() === 'en'
const publicCache = (response) => {
  response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600')
  response.setHeader('Vary', 'Accept-Encoding')
}

const validationResponse = (response, errors) => json(response, 400, {
  title: 'One or more validation errors occurred.',
  errors,
})

const characterSelect = `
  SELECT "Id" AS id, "NameVi" AS "nameVi", "NameEn" AS "nameEn", "ImageUrl" AS "imageUrl",
         "Tier" AS tier, "TypeVi" AS "typeVi", "TypeEn" AS "typeEn",
         "FactionVi" AS "factionVi", "FactionEn" AS "factionEn",
         "RolesVi" AS "rolesVi", "RolesEn" AS "rolesEn", "DuyenVi" AS "duyenVi", "DuyenEn" AS "duyenEn",
         "BioVi" AS "bioVi", "BioEn" AS "bioEn", "KeepsakeIcon" AS "keepsakeIcon",
         "TraitsVi" AS "traitsVi", "TraitsEn" AS "traitsEn", "BondListVi" AS "bondListVi",
         "BondListEn" AS "bondListEn", "ClassLevel" AS "classLevel", "ReleaseSea" AS "releaseSea",
         "ReleaseChina" AS "releaseChina", base_atk AS "baseAtk", base_hp AS "baseHp",
         base_def AS "baseDef", base_spd AS "baseSpd", pvp_atk AS "pvpAtk", pvp_hp AS "pvpHp",
         pvp_def AS "pvpDef", pvp_spd AS "pvpSpd", "UpdatedAt" AS "updatedAt"
    FROM characters`

const mapCharacter = (row) => ({
  id: row.id,
  nameVi: row.nameVi,
  nameEn: row.nameEn,
  imageUrl: row.imageUrl,
  tier: row.tier,
  typeVi: row.typeVi,
  typeEn: row.typeEn,
  factionVi: row.factionVi,
  factionEn: row.factionEn,
  rolesVi: row.rolesVi || [],
  rolesEn: row.rolesEn || [],
  duyenVi: row.duyenVi,
  duyenEn: row.duyenEn,
  bioVi: row.bioVi,
  bioEn: row.bioEn,
  keepsakeIcon: row.keepsakeIcon || null,
  traitsVi: row.traitsVi || [],
  traitsEn: row.traitsEn || [],
  bondListVi: row.bondListVi,
  bondListEn: row.bondListEn,
  classLevel: row.classLevel,
  releaseSea: dateValue(row.releaseSea),
  releaseChina: dateValue(row.releaseChina),
  baseStats: { atk: number(row.baseAtk), hp: number(row.baseHp), def: number(row.baseDef), spd: number(row.baseSpd) },
  pvpStats: { atk: number(row.pvpAtk), hp: number(row.pvpHp), def: number(row.pvpDef), spd: number(row.pvpSpd) },
  updatedAt: row.updatedAt,
})

const mapPublicCharacter = (row, language, detail = false, skills = [], effects = []) => {
  const character = mapCharacter(row)
  const english = isEnglish(language)
  const localized = {
    id: character.id,
    name: english ? character.nameEn : character.nameVi,
    imageUrl: character.imageUrl,
    tier: character.tier,
    type: english ? character.typeEn : character.typeVi,
    faction: english ? character.factionEn : character.factionVi,
    roles: english ? character.rolesEn : character.rolesVi,
    classLevel: character.classLevel,
    keepsakeIcon: character.keepsakeIcon,
    releaseSea: character.releaseSea,
    releaseChina: character.releaseChina,
  }
  if (!detail) return localized
  return {
    ...localized,
    duyen: english ? character.duyenEn : character.duyenVi,
    bio: english ? character.bioEn : character.bioVi,
    traits: english ? character.traitsEn : character.traitsVi,
    bondList: english ? character.bondListEn : character.bondListVi,
    baseStats: character.baseStats,
    pvpStats: character.pvpStats,
    skills: skills.map((skill) => ({
      sortOrder: skill.sortOrder,
      name: english ? skill.nameEn : skill.nameVi,
      description: english ? skill.descriptionEn : skill.descriptionVi,
      type: english ? skill.typeEn : skill.typeVi,
      iconUrl: skill.iconUrl,
      animationUrl: skill.animationUrl,
      keepsakeIconUrl: skill.keepsakeIconUrl,
    })),
    effects: effects.map((effect) => ({
      sortOrder: effect.sortOrder,
      term: english ? effect.termEn : effect.termVi,
      description: english ? effect.descriptionEn : effect.descriptionVi,
    })),
    updatedAt: character.updatedAt,
  }
}

const characterPayload = (body) => ({
  id: text(body.id),
  nameVi: text(body.nameVi),
  nameEn: text(body.nameEn),
  imageUrl: text(body.imageUrl),
  tier: text(body.tier),
  typeVi: text(body.typeVi),
  typeEn: text(body.typeEn),
  factionVi: text(body.factionVi),
  factionEn: text(body.factionEn),
  rolesVi: list(body.rolesVi),
  rolesEn: list(body.rolesEn),
  duyenVi: text(body.duyenVi),
  duyenEn: text(body.duyenEn),
  bioVi: text(body.bioVi),
  bioEn: text(body.bioEn),
  keepsakeIcon: text(body.keepsakeIcon) || null,
  traitsVi: list(body.traitsVi),
  traitsEn: list(body.traitsEn),
  bondListVi: text(body.bondListVi),
  bondListEn: text(body.bondListEn),
  classLevel: text(body.classLevel),
  releaseSea: text(body.releaseSea) || null,
  releaseChina: text(body.releaseChina) || null,
  baseAtk: number(body.baseStats?.atk),
  baseHp: number(body.baseStats?.hp),
  baseDef: number(body.baseStats?.def),
  baseSpd: number(body.baseStats?.spd),
  pvpAtk: number(body.pvpStats?.atk),
  pvpHp: number(body.pvpStats?.hp),
  pvpDef: number(body.pvpStats?.def),
  pvpSpd: number(body.pvpStats?.spd),
})

export const validateCharacter = (payload) => {
  const errors = {}
  for (const [field, max] of Object.entries({
    id: 80, nameVi: 200, nameEn: 200, tier: 20,
    typeVi: 100, typeEn: 100, factionVi: 100, factionEn: 100,
  })) {
    if (!payload[field]) errors[field] = ['This field is required.']
    else if (payload[field].length > max) errors[field] = [`This field cannot exceed ${max} characters.`]
  }
  if (/[\\/]/.test(payload.id)) errors.id = ['Id cannot contain path separators.']
  if (payload.keepsakeIcon?.includes('+')) errors.keepsakeIcon = ["Keepsake path cannot contain '+'. Use a deploy-safe name such as SSRplus."]
  if ((payload.keepsakeIcon?.length || 0) > 500) errors.keepsakeIcon = ['Keepsake path cannot exceed 500 characters.']
  const stats = [payload.baseAtk, payload.baseHp, payload.baseDef, payload.baseSpd,
    payload.pvpAtk, payload.pvpHp, payload.pvpDef, payload.pvpSpd]
  if (stats.some((item) => item < 0)) errors.stats = ['Character stats cannot be negative.']
  for (const field of ['releaseSea', 'releaseChina']) {
    if (payload[field] && !/^\d{4}-\d{2}-\d{2}$/.test(payload[field])) errors[field] = ['Date must use YYYY-MM-DD.']
  }
  return errors
}

const characterRecordDefinition = `
  id text, "nameVi" text, "nameEn" text, "imageUrl" text, tier text,
  "typeVi" text, "typeEn" text, "factionVi" text, "factionEn" text,
  "rolesVi" text[], "rolesEn" text[], "duyenVi" text, "duyenEn" text,
  "bioVi" text, "bioEn" text, "keepsakeIcon" text, "traitsVi" text[], "traitsEn" text[],
  "bondListVi" text, "bondListEn" text, "classLevel" text, "releaseSea" text, "releaseChina" text,
  "baseAtk" integer, "baseHp" integer, "baseDef" integer, "baseSpd" integer,
  "pvpAtk" integer, "pvpHp" integer, "pvpDef" integer, "pvpSpd" integer`

const insertCharacter = async (sql, payload) => sql.query(
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
     FROM jsonb_to_record($1::jsonb) AS x(${characterRecordDefinition})
   ON CONFLICT ("Id") DO NOTHING
   RETURNING "Id" AS id`,
  [JSON.stringify(payload)],
)

const updateCharacter = async (sql, id, payload) => sql.query(
  `UPDATE characters c SET
     "NameVi" = x."nameVi", "NameEn" = x."nameEn", "ImageUrl" = x."imageUrl", "Tier" = x.tier,
     "TypeVi" = x."typeVi", "TypeEn" = x."typeEn", "FactionVi" = x."factionVi", "FactionEn" = x."factionEn",
     "RolesVi" = x."rolesVi", "RolesEn" = x."rolesEn", "DuyenVi" = x."duyenVi", "DuyenEn" = x."duyenEn",
     "BioVi" = x."bioVi", "BioEn" = x."bioEn", "KeepsakeIcon" = x."keepsakeIcon",
     "TraitsVi" = x."traitsVi", "TraitsEn" = x."traitsEn", "BondListVi" = x."bondListVi",
     "BondListEn" = x."bondListEn", "ClassLevel" = x."classLevel",
     "ReleaseSea" = x."releaseSea"::date, "ReleaseChina" = x."releaseChina"::date,
     base_atk = x."baseAtk", base_hp = x."baseHp", base_def = x."baseDef", base_spd = x."baseSpd",
     pvp_atk = x."pvpAtk", pvp_hp = x."pvpHp", pvp_def = x."pvpDef", pvp_spd = x."pvpSpd",
     "UpdatedAt" = CURRENT_TIMESTAMP
    FROM jsonb_to_record($2::jsonb) AS x(${characterRecordDefinition})
   WHERE c."Id" = $1 RETURNING c."Id" AS id`,
  [id, JSON.stringify(payload)],
)

const handlePublicCharacters = async (request, response, path, sql) => {
  const match = /^\/characters\/([^/]+)$/.exec(path)
  if (path !== '/characters' && !match) return false
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])

  const language = request.query?.language
  if (match) {
    const id = decodeURIComponent(match[1])
    const rows = await sql.query(`${characterSelect} WHERE "Id" = $1 LIMIT 1`, [id])
    if (!rows[0]) return json(response, 404, { message: 'Character not found.' })
    const [skills, effects] = await Promise.all([
      sql.query(
        `SELECT "SortOrder" AS "sortOrder", "NameVi" AS "nameVi", "NameEn" AS "nameEn",
                "DescriptionVi" AS "descriptionVi", "DescriptionEn" AS "descriptionEn",
                "TypeVi" AS "typeVi", "TypeEn" AS "typeEn", "IconUrl" AS "iconUrl",
                "AnimationUrl" AS "animationUrl", "KeepsakeIconUrl" AS "keepsakeIconUrl"
           FROM character_skills WHERE "CharacterId" = $1 ORDER BY "SortOrder"`,
        [id],
      ),
      sql.query(
        `SELECT "SortOrder" AS "sortOrder", "TermVi" AS "termVi", "TermEn" AS "termEn",
                "DescriptionVi" AS "descriptionVi", "DescriptionEn" AS "descriptionEn"
           FROM character_effects WHERE "CharacterId" = $1 ORDER BY "SortOrder"`,
        [id],
      ),
    ])
    publicCache(response)
    return json(response, 200, mapPublicCharacter(rows[0], language, true, skills, effects))
  }

  const english = isEnglish(language)
  const page = Math.max(1, Number.parseInt(request.query?.page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(request.query?.pageSize, 10) || 12))
  const filters = []
  const params = []
  const addFilter = (clause, value) => {
    params.push(value)
    filters.push(clause.replace('?', `$${params.length}`))
  }
  const search = text(request.query?.search)
  const tier = text(request.query?.tier)
  const faction = text(request.query?.faction)
  const type = text(request.query?.type)
  if (search) addFilter(`"${english ? 'NameEn' : 'NameVi'}" ILIKE ?`, `%${search}%`)
  if (tier) addFilter('"Tier" = ?', tier)
  if (faction) addFilter(`"${english ? 'FactionEn' : 'FactionVi'}" = ?`, faction)
  if (type) addFilter(`"${english ? 'TypeEn' : 'TypeVi'}" = ?`, type)
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : ''
  const [count] = await sql.query(`SELECT COUNT(*)::int AS count FROM characters${where}`, params)
  const totalCount = Number(count?.count || 0)
  const nameColumn = english ? 'NameEn' : 'NameVi'
  const order = String(request.query?.sort || '').toLowerCase() === 'name_asc'
    ? ` ORDER BY "${nameColumn}"`
    : ` ORDER BY COALESCE("ReleaseSea", "ReleaseChina") IS NULL,
                       COALESCE("ReleaseSea", "ReleaseChina") DESC, "${nameColumn}"`
  const rows = await sql.query(
    `${characterSelect}${where}${order} OFFSET $${params.length + 1} LIMIT $${params.length + 2}`,
    [...params, (page - 1) * pageSize, pageSize],
  )
  publicCache(response)
  return json(response, 200, {
    items: rows.map((row) => mapPublicCharacter(row, language)),
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  })
}

const eventSelect = `
  SELECT "Id" AS id, "TitleVi" AS "titleVi", "TitleEn" AS "titleEn",
         "DescriptionVi" AS "descriptionVi", "DescriptionEn" AS "descriptionEn",
         "Category" AS category, "ImageUrl" AS "imageUrl", "DetailImages" AS "detailImages",
         "SectionsJson" AS "sectionsJson", "StartDate" AS "startDate", "EndDate" AS "endDate",
         "UpdatedAt" AS "updatedAt" FROM events`

const mapEvent = (row) => ({
  ...row,
  sectionsJson: typeof row.sectionsJson === 'string' ? row.sectionsJson : JSON.stringify(row.sectionsJson ?? []),
  startDate: dateValue(row.startDate),
  endDate: dateValue(row.endDate),
})

const parseSections = (value) => {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return value
  try {
    return JSON.parse(value || '[]')
  } catch {
    return []
  }
}

const mapPublicEvent = (row, language, detail = false) => {
  const english = isEnglish(language)
  const localized = {
    id: row.id,
    title: english ? row.titleEn : row.titleVi,
    description: english ? row.descriptionEn : row.descriptionVi,
    category: row.category,
    imageUrl: row.imageUrl,
    startDate: dateValue(row.startDate),
    endDate: dateValue(row.endDate),
  }
  if (!detail) return localized
  return {
    ...localized,
    detailImages: row.detailImages || [],
    sections: parseSections(row.sectionsJson),
    updatedAt: row.updatedAt,
  }
}

const eventPayload = (body) => ({
  id: text(body.id),
  titleVi: text(body.titleVi),
  titleEn: text(body.titleEn),
  descriptionVi: text(body.descriptionVi),
  descriptionEn: text(body.descriptionEn),
  category: text(body.category) || 'main',
  imageUrl: text(body.imageUrl),
  detailImages: list(body.detailImages),
  sectionsJson: text(body.sectionsJson) || '[]',
  startDate: text(body.startDate),
  endDate: text(body.endDate),
})

const handlePublicEvents = async (request, response, path, sql) => {
  const match = /^\/events\/([^/]+)$/.exec(path)
  if (path !== '/events' && !match) return false
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])

  const language = request.query?.language
  if (match) {
    const id = decodeURIComponent(match[1])
    const rows = await sql.query(`${eventSelect} WHERE "Id" = $1 LIMIT 1`, [id])
    if (!rows[0]) return json(response, 404, { message: 'Event not found.' })
    publicCache(response)
    return json(response, 200, mapPublicEvent(rows[0], language, true))
  }

  const page = Math.max(1, Number.parseInt(request.query?.page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(request.query?.pageSize, 10) || 20))
  const filters = []
  const params = []
  const addFilter = (clause, value) => {
    params.push(value)
    filters.push(clause.replace('?', `$${params.length}`))
  }
  const category = text(request.query?.category)
  const from = text(request.query?.from)
  const to = text(request.query?.to)
  if (category) addFilter('"Category" = ?', category)
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) addFilter('"EndDate" >= ?::date', from)
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) addFilter('"StartDate" <= ?::date', to)
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : ''
  const [count] = await sql.query(`SELECT COUNT(*)::int AS count FROM events${where}`, params)
  const totalCount = Number(count?.count || 0)
  const rows = await sql.query(
    `${eventSelect}${where} ORDER BY "StartDate" DESC, "TitleVi"
       OFFSET $${params.length + 1} LIMIT $${params.length + 2}`,
    [...params, (page - 1) * pageSize, pageSize],
  )
  publicCache(response)
  return json(response, 200, {
    items: rows.map((row) => mapPublicEvent(row, language)),
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  })
}

export const validateEvent = (payload) => {
  const errors = {}
  if (!payload.id || payload.id.length > 100 || /[\\/]/.test(payload.id)) {
    errors.id = ['ID is required, must be at most 100 characters, and cannot contain path separators.']
  }
  if (!payload.titleVi || !payload.titleEn) errors.title = ['Vietnamese and English titles are required.']
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(payload.endDate)) {
    errors.date = ['Dates must use YYYY-MM-DD.']
  } else if (payload.endDate < payload.startDate) errors.date = ['End date cannot be before start date.']
  try { JSON.parse(payload.sectionsJson) } catch { errors.sectionsJson = ['SectionsJson must be valid JSON.'] }
  return errors
}

const eventRecordDefinition = `
  id text, "titleVi" text, "titleEn" text, "descriptionVi" text, "descriptionEn" text,
  category text, "imageUrl" text, "detailImages" text[], "sectionsJson" text,
  "startDate" text, "endDate" text`

const releaseSelect = `
  SELECT "Id" AS id, "Server" AS server, "Date" AS date, "CharacterId" AS "characterId",
         "BannerImage" AS "bannerImage", "IsReturn" AS "isReturn", "OverrideNameVi" AS "overrideNameVi",
         "OverrideNameEn" AS "overrideNameEn", "OverrideTier" AS "overrideTier",
         "OverrideFactionVi" AS "overrideFactionVi", "OverrideFactionEn" AS "overrideFactionEn",
         "OverrideTypeVi" AS "overrideTypeVi", "OverrideTypeEn" AS "overrideTypeEn",
         "OverrideRoleVi" AS "overrideRoleVi", "OverrideRoleEn" AS "overrideRoleEn",
         "SortOrder" AS "sortOrder" FROM release_schedule`

const mapRelease = (row, language = 'vi') => {
  const english = String(language).toLowerCase() === 'en'
  return {
    ...row,
    id: Number(row.id),
    date: dateValue(row.date),
    sortOrder: Number(row.sortOrder),
    overrideName: english ? row.overrideNameEn : row.overrideNameVi,
    overrideFaction: english ? row.overrideFactionEn : row.overrideFactionVi,
    overrideType: english ? row.overrideTypeEn : row.overrideTypeVi,
    overrideRole: english ? row.overrideRoleEn : row.overrideRoleVi,
  }
}

const releasePayload = (body) => ({
  server: text(body.server).toUpperCase(),
  date: text(body.date),
  characterId: text(body.characterId),
  bannerImage: text(body.bannerImage),
  isReturn: Boolean(body.isReturn),
  overrideNameVi: text(body.overrideNameVi),
  overrideNameEn: text(body.overrideNameEn),
  overrideTier: text(body.overrideTier),
  overrideFactionVi: text(body.overrideFactionVi),
  overrideFactionEn: text(body.overrideFactionEn),
  overrideTypeVi: text(body.overrideTypeVi),
  overrideTypeEn: text(body.overrideTypeEn),
  overrideRoleVi: text(body.overrideRoleVi),
  overrideRoleEn: text(body.overrideRoleEn),
  sortOrder: Number(body.sortOrder),
})

export const validateRelease = (payload) => {
  const errors = {}
  if (!['CN', 'SEA'].includes(payload.server)) errors.server = ['Server must be CN or SEA.']
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) errors.date = ['Date must use YYYY-MM-DD.']
  if (!payload.characterId || payload.characterId.length > 80) errors.characterId = ['Character ID is invalid.']
  if (payload.bannerImage.length > 500) errors.bannerImage = ['Banner path is too long.']
  if (!Number.isInteger(payload.sortOrder) || payload.sortOrder < 0 || payload.sortOrder > 100) {
    errors.sortOrder = ['Sort order must be an integer from 0 to 100.']
  }
  return errors
}

const releaseRecordDefinition = `
  server text, date text, "characterId" text, "bannerImage" text, "isReturn" boolean,
  "overrideNameVi" text, "overrideNameEn" text, "overrideTier" text,
  "overrideFactionVi" text, "overrideFactionEn" text, "overrideTypeVi" text, "overrideTypeEn" text,
  "overrideRoleVi" text, "overrideRoleEn" text, "sortOrder" integer`

const handleCharacters = async (request, response, path, sql) => {
  const characterMatch = /^\/admin\/characters\/([^/]+)$/.exec(path)
  const keepsakeMatch = /^\/admin\/keepsakes\/([^/]+)$/.exec(path)

  if (path === '/admin/characters') {
    if (request.method === 'GET') {
      const search = text(request.query?.search)
      const page = Math.max(1, Number.parseInt(request.query?.page, 10) || 1)
      const pageSize = Math.min(100, Math.max(1, Number.parseInt(request.query?.pageSize, 10) || 20))
      const where = search ? ' WHERE "NameVi" ILIKE $1 OR "NameEn" ILIKE $1 OR "Id" ILIKE $1' : ''
      const params = search ? [`%${search}%`] : []
      const countRows = await sql.query(`SELECT COUNT(*)::int AS count FROM characters${where}`, params)
      const totalCount = Number(countRows[0]?.count || 0)
      const rows = await sql.query(
        `${characterSelect}${where} ORDER BY "UpdatedAt" DESC, "NameVi" OFFSET $${params.length + 1} LIMIT $${params.length + 2}`,
        [...params, (page - 1) * pageSize, pageSize],
      )
      return json(response, 200, {
        items: rows.map(mapCharacter), page, pageSize, totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      })
    }
    if (request.method === 'POST') {
      const payload = characterPayload(bodyOf(request))
      const errors = validateCharacter(payload)
      if (Object.keys(errors).length) return validationResponse(response, errors)
      const inserted = await insertCharacter(sql, payload)
      if (!inserted[0]) return json(response, 409, { message: `Character '${payload.id}' already exists.` })
      const rows = await sql.query(`${characterSelect} WHERE "Id" = $1`, [payload.id])
      return json(response, 201, mapCharacter(rows[0]))
    }
    return methodNotAllowed(response, ['GET', 'POST'])
  }

  if (characterMatch) {
    const id = decodeURIComponent(characterMatch[1])
    if (request.method === 'GET') {
      const rows = await sql.query(`${characterSelect} WHERE "Id" = $1 LIMIT 1`, [id])
      return rows[0] ? json(response, 200, mapCharacter(rows[0])) : json(response, 404, { message: 'Character not found.' })
    }
    if (request.method === 'PUT') {
      const payload = characterPayload(bodyOf(request))
      if (id !== payload.id) return json(response, 400, { message: 'Route id and payload id must match.' })
      const errors = validateCharacter(payload)
      if (Object.keys(errors).length) return validationResponse(response, errors)
      const updated = await updateCharacter(sql, id, payload)
      if (!updated[0]) return json(response, 404, { message: 'Character not found.' })
      const rows = await sql.query(`${characterSelect} WHERE "Id" = $1`, [id])
      return json(response, 200, mapCharacter(rows[0]))
    }
    if (request.method === 'DELETE') {
      const rows = await sql.query('DELETE FROM characters WHERE "Id" = $1 RETURNING "Id"', [id])
      return rows[0] ? noContent(response) : json(response, 404, { message: 'Character not found.' })
    }
    return methodNotAllowed(response, ['GET', 'PUT', 'DELETE'])
  }

  if (keepsakeMatch) {
    const id = decodeURIComponent(keepsakeMatch[1])
    if (!['PUT', 'DELETE'].includes(request.method)) return methodNotAllowed(response, ['PUT', 'DELETE'])
    const iconUrl = request.method === 'DELETE' ? null : text(bodyOf(request).iconUrl)
    if (request.method === 'PUT' && (!iconUrl || iconUrl.length > 500 || iconUrl.includes('+'))) {
      return validationResponse(response, { iconUrl: ["Icon path is required, must be at most 500 characters, and cannot contain '+'."] })
    }
    const updated = await sql.query(
      'UPDATE characters SET "KeepsakeIcon" = $2, "UpdatedAt" = CURRENT_TIMESTAMP WHERE "Id" = $1 RETURNING "Id"',
      [id, iconUrl],
    )
    if (!updated[0]) return json(response, 404, { message: 'Character not found.' })
    if (request.method === 'DELETE') return noContent(response)
    const rows = await sql.query(`${characterSelect} WHERE "Id" = $1`, [id])
    return json(response, 200, mapCharacter(rows[0]))
  }
  return false
}

const handleEvents = async (request, response, path, sql) => {
  const match = /^\/admin\/events\/([^/]+)$/.exec(path)
  if (path === '/admin/events') {
    if (request.method === 'GET') {
      const rows = await sql.query(`${eventSelect} ORDER BY "StartDate" DESC`)
      return json(response, 200, rows.map(mapEvent))
    }
    if (request.method === 'POST') {
      const payload = eventPayload(bodyOf(request))
      const errors = validateEvent(payload)
      if (Object.keys(errors).length) return validationResponse(response, errors)
      const rows = await sql.query(
        `INSERT INTO events ("Id", "TitleVi", "TitleEn", "DescriptionVi", "DescriptionEn", "Category",
           "ImageUrl", "DetailImages", "SectionsJson", "StartDate", "EndDate")
         SELECT x.id, x."titleVi", x."titleEn", x."descriptionVi", x."descriptionEn", x.category,
                x."imageUrl", x."detailImages", x."sectionsJson"::jsonb, x."startDate"::date, x."endDate"::date
           FROM jsonb_to_record($1::jsonb) AS x(${eventRecordDefinition})
         ON CONFLICT ("Id") DO NOTHING RETURNING "Id" AS id`,
        [JSON.stringify(payload)],
      )
      if (!rows[0]) return json(response, 409, { message: `Event '${payload.id}' already exists.` })
      const result = await sql.query(`${eventSelect} WHERE "Id" = $1`, [payload.id])
      return json(response, 201, mapEvent(result[0]))
    }
    return methodNotAllowed(response, ['GET', 'POST'])
  }
  if (!match) return false
  const id = decodeURIComponent(match[1])
  if (request.method === 'PUT') {
    const payload = eventPayload(bodyOf(request))
    if (id !== payload.id) return json(response, 400, { message: 'Route id and payload id must match.' })
    const errors = validateEvent(payload)
    if (Object.keys(errors).length) return validationResponse(response, errors)
    const rows = await sql.query(
      `UPDATE events e SET "TitleVi" = x."titleVi", "TitleEn" = x."titleEn",
         "DescriptionVi" = x."descriptionVi", "DescriptionEn" = x."descriptionEn", "Category" = x.category,
         "ImageUrl" = x."imageUrl", "DetailImages" = x."detailImages", "SectionsJson" = x."sectionsJson"::jsonb,
         "StartDate" = x."startDate"::date, "EndDate" = x."endDate"::date, "UpdatedAt" = CURRENT_TIMESTAMP
        FROM jsonb_to_record($2::jsonb) AS x(${eventRecordDefinition})
       WHERE e."Id" = $1 RETURNING e."Id" AS id`,
      [id, JSON.stringify(payload)],
    )
    if (!rows[0]) return json(response, 404, { message: 'Event not found.' })
    const result = await sql.query(`${eventSelect} WHERE "Id" = $1`, [id])
    return json(response, 200, mapEvent(result[0]))
  }
  if (request.method === 'DELETE') {
    const rows = await sql.query('DELETE FROM events WHERE "Id" = $1 RETURNING "Id"', [id])
    return rows[0] ? noContent(response) : json(response, 404, { message: 'Event not found.' })
  }
  return methodNotAllowed(response, ['PUT', 'DELETE'])
}

const handleReleases = async (request, response, path, sql) => {
  if (path === '/release-schedule') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    const rows = await sql.query(`${releaseSelect} ORDER BY "Date", "Server", "SortOrder"`)
    publicCache(response)
    return json(response, 200, rows.map((row) => mapRelease(row, request.query?.language)))
  }
  const match = /^\/admin\/releases\/(\d+)$/.exec(path)
  if (path === '/admin/releases') {
    if (request.method === 'GET') {
      const rows = await sql.query(`${releaseSelect} ORDER BY "Date", "Server", "SortOrder"`)
      return json(response, 200, rows.map((row) => mapRelease(row, 'vi')))
    }
    if (request.method === 'POST') {
      const payload = releasePayload(bodyOf(request))
      const errors = validateRelease(payload)
      if (Object.keys(errors).length) return validationResponse(response, errors)
      try {
        const inserted = await sql.query(
          `INSERT INTO release_schedule ("Server", "Date", "CharacterId", "BannerImage", "IsReturn",
             "OverrideNameVi", "OverrideNameEn", "OverrideTier", "OverrideFactionVi", "OverrideFactionEn",
             "OverrideTypeVi", "OverrideTypeEn", "OverrideRoleVi", "OverrideRoleEn", "SortOrder")
           SELECT x.server, x.date::date, x."characterId", x."bannerImage", x."isReturn", x."overrideNameVi",
                  x."overrideNameEn", x."overrideTier", x."overrideFactionVi", x."overrideFactionEn",
                  x."overrideTypeVi", x."overrideTypeEn", x."overrideRoleVi", x."overrideRoleEn", x."sortOrder"
             FROM jsonb_to_record($1::jsonb) AS x(${releaseRecordDefinition})
           RETURNING "Id" AS id`,
          [JSON.stringify(payload)],
        )
        const rows = await sql.query(`${releaseSelect} WHERE "Id" = $1`, [inserted[0].id])
        return json(response, 201, mapRelease(rows[0], 'vi'))
      } catch (error) {
        if (error?.code === '23505') return json(response, 409, { message: 'A release already uses this date, server, and sort order.' })
        throw error
      }
    }
    return methodNotAllowed(response, ['GET', 'POST'])
  }
  if (!match) return false
  const id = Number(match[1])
  if (request.method === 'PUT') {
    const payload = releasePayload(bodyOf(request))
    const errors = validateRelease(payload)
    if (Object.keys(errors).length) return validationResponse(response, errors)
    try {
      const updated = await sql.query(
        `UPDATE release_schedule r SET "Server" = x.server, "Date" = x.date::date,
           "CharacterId" = x."characterId", "BannerImage" = x."bannerImage", "IsReturn" = x."isReturn",
           "OverrideNameVi" = x."overrideNameVi", "OverrideNameEn" = x."overrideNameEn",
           "OverrideTier" = x."overrideTier", "OverrideFactionVi" = x."overrideFactionVi",
           "OverrideFactionEn" = x."overrideFactionEn", "OverrideTypeVi" = x."overrideTypeVi",
           "OverrideTypeEn" = x."overrideTypeEn", "OverrideRoleVi" = x."overrideRoleVi",
           "OverrideRoleEn" = x."overrideRoleEn", "SortOrder" = x."sortOrder", "UpdatedAt" = CURRENT_TIMESTAMP
          FROM jsonb_to_record($2::jsonb) AS x(${releaseRecordDefinition})
         WHERE r."Id" = $1 RETURNING r."Id" AS id`,
        [id, JSON.stringify(payload)],
      )
      if (!updated[0]) return json(response, 404, { message: 'Release entry not found.' })
      const rows = await sql.query(`${releaseSelect} WHERE "Id" = $1`, [id])
      return json(response, 200, mapRelease(rows[0], 'vi'))
    } catch (error) {
      if (error?.code === '23505') return json(response, 409, { message: 'A release already uses this date, server, and sort order.' })
      throw error
    }
  }
  if (request.method === 'DELETE') {
    const rows = await sql.query('DELETE FROM release_schedule WHERE "Id" = $1 RETURNING "Id"', [id])
    return rows[0] ? noContent(response) : json(response, 404, { message: 'Release entry not found.' })
  }
  return methodNotAllowed(response, ['PUT', 'DELETE'])
}

export const createAdminDataRouteHandler = ({
  ensureSchema = ensureAdminSchema,
  sqlProvider = getSql,
} = {}) => async (request, response, path) => {
  const isPublicContent = path === '/release-schedule' || path === '/characters' ||
    /^\/characters\/[^/]+$/.test(path) || path === '/events' || /^\/events\/[^/]+$/.test(path)
  const isAdminData = path.startsWith('/admin/characters') || path.startsWith('/admin/keepsakes') ||
    path.startsWith('/admin/events') || path.startsWith('/admin/releases')
  if (!isPublicContent && !isAdminData) return false

  if (isAdminData && !requireUser(request, response, ['Admin'])) return true
  await ensureSchema()
  const sql = sqlProvider()

  if (path === '/release-schedule' || path.startsWith('/admin/releases')) return handleReleases(request, response, path, sql)
  if (path === '/characters' || path.startsWith('/characters/')) return handlePublicCharacters(request, response, path, sql)
  if (path === '/events' || path.startsWith('/events/')) return handlePublicEvents(request, response, path, sql)
  if (path.startsWith('/admin/events')) return handleEvents(request, response, path, sql)
  return handleCharacters(request, response, path, sql)
}

export const handleAdminDataRoute = createAdminDataRouteHandler()
