const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseIsoDateLocal(iso: string): Date | null {
  const match = iso.match(ISO_DATE_PATTERN)
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  return new Date(year, month - 1, day)
}

export function normalizeDateValue(value: string): string {
  if (!value) return ''
  const match = value.match(ISO_DATE_PATTERN)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

export function todayIsoLocal(): string {
  const today = new Date()
  return toIsoDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
}

/** Exibe data no padrão brasileiro (dd/MM/yyyy). */
export function formatDatePtBr(value: string): string {
  const date = parseIsoDateLocal(normalizeDateValue(value))
  if (!date) return ''
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Máscara dd/mm/aaaa a partir de dígitos. */
export function formatDateInputMaskFromDigits(digits: string): string {
  const normalized = digits.replace(/\D/g, '').slice(0, 8)
  if (normalized.length <= 2) return normalized
  if (normalized.length <= 4) return `${normalized.slice(0, 2)}/${normalized.slice(2)}`
  return `${normalized.slice(0, 2)}/${normalized.slice(2, 4)}/${normalized.slice(4)}`
}

export function isValidDateParts(day: number, month: number, year: number): boolean {
  if (month < 1 || month > 12 || day < 1 || year < 1000 || year > 9999) return false
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** Converte entrada manual pt-BR (dd/mm/aaaa) para ISO local. */
export function parseDatePtBrInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const match = trimmed.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (!isValidDateParts(day, month, year)) return null
  return toIsoDate(year, month, day)
}

export function isIsoDateWithinBounds(value: string, min?: string, max?: string): boolean {
  const normalized = normalizeDateValue(value)
  if (!normalized) return false
  if (min && isIsoDateBefore(normalized, min)) return false
  if (max && isIsoDateAfter(normalized, max)) return false
  return true
}

export function compareIsoDates(a: string, b: string): number {
  const dateA = parseIsoDateLocal(a)
  const dateB = parseIsoDateLocal(b)
  if (!dateA || !dateB) return 0
  return dateA.getTime() - dateB.getTime()
}

export function isIsoDateBefore(a: string, b: string): boolean {
  return compareIsoDates(a, b) < 0
}

export function isIsoDateAfter(a: string, b: string): boolean {
  return compareIsoDates(a, b) > 0
}

export function isSameIsoDate(a: string, b: string): boolean {
  return normalizeDateValue(a) === normalizeDateValue(b)
}

export const WEEKDAY_LABELS_PT_BR = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'] as const

export const MONTH_LABELS_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export interface CalendarDayCell {
  iso: string | null
  day: number | null
  disabled: boolean
  isToday: boolean
  isSelected: boolean
  isOutsideMonth: boolean
}

export function buildCalendarMonth(
  year: number,
  month: number,
  options: {
    selected?: string
    min?: string
    max?: string
  } = {},
): CalendarDayCell[] {
  const { selected = '', min = '', max = '' } = options
  const today = todayIsoLocal()
  const firstDay = new Date(year, month - 1, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
  const cells: CalendarDayCell[] = []

  function pushDay(dayYear: number, dayMonth: number, day: number, isOutsideMonth: boolean) {
    const iso = toIsoDate(dayYear, dayMonth, day)
    const disabled =
      (min ? isIsoDateBefore(iso, min) : false) ||
      (max ? isIsoDateAfter(iso, max) : false)

    cells.push({
      iso,
      day,
      disabled,
      isToday: iso === today,
      isSelected: selected ? isSameIsoDate(iso, selected) : false,
      isOutsideMonth,
    })
  }

  for (let index = 0; index < startOffset; index += 1) {
    const day = daysInPrevMonth - startOffset + index + 1
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    pushDay(prevYear, prevMonth, day, true)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    pushDay(year, month, day, false)
  }

  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    pushDay(nextYear, nextMonth, nextDay, true)
    nextDay += 1
  }

  return cells
}
