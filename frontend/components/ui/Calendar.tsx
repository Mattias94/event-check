'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
  MONTH_LABELS_PT_BR,
  WEEKDAY_LABELS_PT_BR,
  buildCalendarMonth,
  normalizeDateValue,
  parseIsoDateLocal,
} from '../../lib/date-utils'
import { cn } from '../../lib/utils'

export interface CalendarProps {
  value?: string
  onSelect: (value: string) => void
  min?: string
  max?: string
  month: number
  year: number
  onMonthChange: (year: number, month: number) => void
  className?: string
  size?: 'default' | 'compact'
}

const navButtonClassName =
  'inline-flex items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40'

export function Calendar({
  value = '',
  onSelect,
  min,
  max,
  month,
  year,
  onMonthChange,
  className,
  size = 'default',
}: CalendarProps) {
  const normalized = normalizeDateValue(value)
  const cells = buildCalendarMonth(year, month, { selected: normalized, min, max })
  const isCompact = size === 'compact'
  const weeks = Math.ceil(cells.length / 7)

  function goToPreviousYear() {
    onMonthChange(year - 1, month)
  }

  function goToNextYear() {
    onMonthChange(year + 1, month)
  }

  function goToPreviousMonth() {
    if (month === 1) {
      onMonthChange(year - 1, 12)
      return
    }
    onMonthChange(year, month - 1)
  }

  function goToNextMonth() {
    if (month === 12) {
      onMonthChange(year + 1, 1)
      return
    }
    onMonthChange(year, month + 1)
  }

  const navSize = isCompact ? 'size-9' : 'size-10 sm:size-11'
  const navIconSize = isCompact ? 'size-3.5' : 'size-4'
  const doubleNavIconSize = isCompact ? 'size-3' : 'size-3.5'

  return (
    <div className={cn('w-full min-w-0 select-none', className)}>
      <div
        className={cn(
          'mb-2 flex items-center justify-between gap-0.5',
          !isCompact && 'mb-3 gap-1',
        )}
      >
        <button
          type="button"
          onClick={goToPreviousYear}
          className={cn(navButtonClassName, navSize)}
          aria-label="Ano anterior"
        >
          <ChevronsLeft className={doubleNavIconSize} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={goToPreviousMonth}
          className={cn(navButtonClassName, navSize)}
          aria-label="Mês anterior"
        >
          <ChevronLeft className={navIconSize} aria-hidden="true" />
        </button>

        <p
          className={cn(
            'min-w-0 flex-1 truncate px-1 text-center font-semibold capitalize text-primary',
            isCompact ? 'text-xs' : 'text-sm sm:text-base',
          )}
          aria-live="polite"
        >
          {MONTH_LABELS_PT_BR[month - 1]} {year}
        </p>

        <button
          type="button"
          onClick={goToNextMonth}
          className={cn(navButtonClassName, navSize)}
          aria-label="Próximo mês"
        >
          <ChevronRight className={navIconSize} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={goToNextYear}
          className={cn(navButtonClassName, navSize)}
          aria-label="Próximo ano"
        >
          <ChevronsRight className={doubleNavIconSize} aria-hidden="true" />
        </button>
      </div>

      <div
        className={cn('overflow-hidden rounded-lg border border-border/60', isCompact ? 'text-[11px]' : 'text-xs sm:text-sm')}
        role="grid"
        aria-label="Calendário"
      >
        <div className="grid grid-cols-7 border-b border-border/60 bg-card">
          {WEEKDAY_LABELS_PT_BR.map((label) => (
            <div
              key={label}
              role="columnheader"
              className={cn(
                'py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-foreground sm:text-[11px]',
                isCompact && 'py-1 text-[9px]',
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {Array.from({ length: weeks }, (_, weekIndex) => (
          <div
            key={weekIndex}
            className={cn(
              'grid grid-cols-7',
              weekIndex % 2 === 1 ? 'bg-muted/35' : 'bg-card',
            )}
          >
            {cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((cell) => {
              const parsed = cell.iso ? parseIsoDateLocal(cell.iso) : null

              return (
                <button
                  key={cell.iso}
                  type="button"
                  role="gridcell"
                  disabled={cell.disabled}
                  aria-label={
                    parsed
                      ? parsed.toLocaleDateString('pt-BR', { dateStyle: 'long' })
                      : undefined
                  }
                  aria-selected={cell.isSelected}
                  aria-current={cell.isToday ? 'date' : undefined}
                  onClick={() => cell.iso && onSelect(cell.iso)}
                  className={cn(
                    'flex aspect-square items-center justify-center font-medium tabular-nums transition-colors',
                    isCompact ? 'min-h-9' : 'min-h-10 sm:min-h-11',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    'disabled:cursor-not-allowed disabled:opacity-35',
                    cell.isSelected
                      ? 'rounded-md bg-primary font-semibold text-primary-foreground shadow-sm'
                      : cell.isOutsideMonth
                        ? 'text-muted-foreground/45 hover:bg-accent/50'
                        : 'text-primary hover:bg-primary/10',
                    cell.isToday && !cell.isSelected && 'font-semibold underline decoration-primary/50 underline-offset-2',
                  )}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Calendar
