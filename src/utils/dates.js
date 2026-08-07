/** Shared local date helpers (YYYY-MM-DD, no UTC shift). */

export function toLocalDateKey(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayLocalDate() {
  return toLocalDateKey(new Date())
}

/** Alias used by focus/analytics modules. */
export const getLocalDateKey = toLocalDateKey

export function fromLocalDateKey(dateKey) {
  if (!dateKey) {
    return new Date()
  }

  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export function isValidDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  return toLocalDateKey(fromLocalDateKey(value)) === value
}

export function normalizeDateValue(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  return isValidDateKey(value) ? value : null
}

/** Add calendar days to a YYYY-MM-DD key. */
export function addDaysToDateKey(dateKey, amount) {
  const date = fromLocalDateKey(dateKey)
  date.setDate(date.getDate() + amount)
  return toLocalDateKey(date)
}

/** Signed day difference: `toDateKey` minus `fromDateKey`. */
export function daysBetween(fromDateKey, toDateKey) {
  const from = fromLocalDateKey(fromDateKey)
  const to = fromLocalDateKey(toDateKey)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((to.getTime() - from.getTime()) / msPerDay)
}
