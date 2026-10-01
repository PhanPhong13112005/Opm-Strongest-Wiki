export const releaseScheduleKey = row => `${row.server}|${row.date}|${row.sortOrder}`

export const isValidReleaseScheduleResponse = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return false

  const keys = new Set()
  for (const row of rows) {
    if (!row || typeof row !== 'object') return false
    if (!['CN', 'SEA'].includes(row.server)) return false
    const hasFullDate = /^\d{4}-\d{2}-\d{2}$/.test(row.date || '')
    const hasMonthPrecision = row.datePrecision === 'month' && /^\d{4}-\d{2}$/.test(row.date || '')
    if (!hasFullDate && !hasMonthPrecision) return false
    if (!Number.isInteger(row.sortOrder) || row.sortOrder < 1) return false
    if (typeof row.characterId !== 'string' || !row.characterId.trim()) return false
    if (typeof row.bannerImage !== 'string' || !row.bannerImage.trim()) return false
    if (typeof row.isReturn !== 'boolean') return false

    const key = releaseScheduleKey(row)
    if (keys.has(key)) return false
    keys.add(key)
  }

  return true
}

export const localizeReleaseScheduleFallback = (rows, language) => {
  const english = language === 'en'
  return rows.map(row => ({
    ...row,
    overrideName: english ? row.overrideNameEn : row.overrideNameVi,
    overrideFaction: english ? row.overrideFactionEn : row.overrideFactionVi,
    overrideType: english ? row.overrideTypeEn : row.overrideTypeVi,
    overrideRole: english ? row.overrideRoleEn : row.overrideRoleVi,
  }))
}

export const loadReleaseScheduleWithFallback = async ({
  request,
  fallbackRows,
  language,
}) => {
  try {
    const rows = await request(language)
    if (!isValidReleaseScheduleResponse(rows)) {
      throw new TypeError('Release schedule API returned an invalid response.')
    }
    return rows
  } catch {
    return localizeReleaseScheduleFallback(fallbackRows, language)
  }
}
