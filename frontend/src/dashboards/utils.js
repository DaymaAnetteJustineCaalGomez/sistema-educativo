export const formatPercent = (value, { fallback = '0%' } = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback
  return `${Number(value).toFixed(0)}%`
}

export const formatNumber = (value, { fallback = '0' } = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback
  return new Intl.NumberFormat('es-GT').format(Number(value))
}

export const formatDuration = (seconds = 0) => {
  if (!seconds || Number.isNaN(Number(seconds))) return '0 m'
  const total = Math.max(0, Math.round(Number(seconds)))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (hours <= 0) return `${minutes} m`
  return `${hours} h ${minutes.toString().padStart(2, '0')} m`
}

export const formatShortDate = (input) => {
  if (!input) return ''
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })
}

export const formatLongDate = (input) => {
  if (!input) return ''
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const weekdayLabel = (input) => {
  if (!input) return ''
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-GT', { weekday: 'short' }).replace('.', '')
}

export const positiveOrZero = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0)

export const formatAttempts = ({ used = 0, limit = 3 }) => {
  const safeUsed = Math.min(positiveOrZero(used), limit)
  return `${safeUsed} / ${limit}`
}

export const gradeLabel = (grade) => ({ 1: '1ro. Básico', 2: '2do. Básico', 3: '3ro. Básico' }[Number(grade)] || 'Sin grado')
