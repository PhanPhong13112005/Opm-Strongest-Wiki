const validMonth = /^([1-9]\d{3})-(0[1-9]|1[0-2])$/

export const parseScheduleMonth = value => {
  const match = typeof value === 'string' && validMonth.exec(value)
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null
}

export const currentScheduleMonth = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit',
  }).formatToParts(now)
  return `${parts.find(part => part.type === 'year').value}-${parts.find(part => part.type === 'month').value}`
}

export const initialScheduleMonth = (queryMonth, now = new Date()) => (
  parseScheduleMonth(queryMonth) ? queryMonth : currentScheduleMonth(now)
)

export const scheduleMonthDate = key => {
  const month = parseScheduleMonth(key)
  if (!month) throw new RangeError('Invalid schedule month')
  return new Date(month.year, month.month - 1, 1)
}

export const shiftScheduleMonth = (key, offset) => {
  const month = parseScheduleMonth(key)
  if (!month || !Number.isInteger(offset)) throw new RangeError('Invalid schedule month or offset')
  const serial = month.year * 12 + month.month - 1 + offset
  const year = Math.floor(serial / 12)
  if (year < 1000 || year > 9999) return null
  return `${year}-${String(serial % 12 + 1).padStart(2, '0')}`
}
