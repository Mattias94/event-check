'use client'

import { forwardRef, useEffect, useId, useState } from 'react'
import { Clock } from 'lucide-react'
import Input from '../ui/Input'
import { formErrorClassName, formHintClassName, formLabelClassName } from '../../lib/form-styles'
import { cn } from '../../lib/utils'

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

export function normalizeTimeValue(value: string): string {
  if (!value) return ''
  const match = value.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

function useMobileTimeSelects(): boolean {
  const [useSelects, setUseSelects] = useState(false)

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const narrow = window.matchMedia('(max-width: 768px)').matches
    setUseSelects(coarse || narrow)
  }, [])

  return useSelects
}

interface TimePickerColumnProps {
  label: string
  value: string
  options: string[]
  suffix?: string
  disabled?: boolean
  error?: boolean
  columns?: 2 | 3 | 4
  onSelect: (value: string) => void
  onBlur?: () => void
}

function TimePickerColumn({
  label,
  value,
  options,
  suffix,
  disabled,
  error,
  columns = 4,
  onSelect,
  onBlur,
}: TimePickerColumnProps) {
  const gridCols =
    columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div
        className="max-h-36 overflow-y-auto overscroll-contain rounded-lg bg-background/60 p-1.5"
      >
        <div className={cn('grid gap-1.5', gridCols)} role="listbox" aria-label={label}>
          {options.map((option) => {
            const selected = value === option
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={disabled}
                onBlur={onBlur}
                onClick={() => onSelect(option)}
                className={cn(
                  'flex min-h-10 items-center justify-center rounded-lg px-1 text-sm font-semibold tabular-nums transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30'
                    : 'bg-card text-foreground hover:bg-accent active:scale-[0.98]',
                  error && !selected && 'ring-1 ring-destructive/20',
                )}
              >
                {option}
                {suffix && (
                  <span className={cn('ml-0.5 text-[10px] font-medium', selected ? 'opacity-90' : 'opacity-60')}>
                    {suffix}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface TimeFieldProps {
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  hint?: string
}

const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(
  ({ value = '', onChange, onBlur, error, disabled, hint }, ref) => {
    const groupId = useId()
    const errorId = error ? `${groupId}-error` : undefined
    const hintId = hint ? `${groupId}-hint` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
    const useSelects = useMobileTimeSelects()
    const normalized = normalizeTimeValue(value)
    const [hour, minute] = normalized ? normalized.split(':') : ['', '']

    function updateTime(nextHour: string, nextMinute: string) {
      if (nextHour && nextMinute) {
        onChange(`${nextHour}:${nextMinute}`)
        return
      }
      if (!nextHour && !nextMinute) {
        onChange('')
      }
    }

    function handleHourSelect(nextHour: string) {
      updateTime(nextHour, minute || '00')
    }

    function handleMinuteSelect(nextMinute: string) {
      updateTime(hour || '09', nextMinute)
    }

    if (useSelects) {
      return (
        <fieldset className="w-full min-w-0 border-0 p-0">
          <legend className={cn(formLabelClassName, 'flex items-center gap-1.5')}>
            <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
            Horário
          </legend>

          <div
            className={cn(
              'rounded-xl border bg-gradient-to-b from-card to-muted/30 p-3 shadow-sm',
              error ? 'border-destructive/60' : 'border-input',
            )}
            role="group"
            aria-describedby={describedBy}
          >
            <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-background/70 px-3 py-2">
              <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                {hour || '--'}
              </span>
              <span className="text-xl font-light text-muted-foreground" aria-hidden="true">
                :
              </span>
              <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                {minute || '--'}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <TimePickerColumn
                label="Hora"
                value={hour}
                options={HOURS}
                suffix="h"
                columns={4}
                disabled={disabled}
                error={Boolean(error)}
                onBlur={onBlur}
                onSelect={handleHourSelect}
              />

              <div
                className="flex shrink-0 self-center pt-8 text-lg font-light text-muted-foreground/50"
                aria-hidden="true"
              >
                :
              </div>

              <TimePickerColumn
                label="Minuto"
                value={minute}
                options={MINUTES}
                suffix="m"
                columns={2}
                disabled={disabled}
                error={Boolean(error)}
                onBlur={onBlur}
                onSelect={handleMinuteSelect}
              />
            </div>
          </div>

          {hint && !error && (
            <p id={hintId} className={formHintClassName}>
              {hint}
            </p>
          )}
          {error && (
            <p id={errorId} role="alert" className={formErrorClassName}>
              {error}
            </p>
          )}
        </fieldset>
      )
    }

    return (
      <Input
        ref={ref}
        label="Horário"
        name="time"
        type="time"
        step={900}
        hint={hint ?? 'Horário de início do evento'}
        className="date-input w-full"
        value={normalized}
        disabled={disabled}
        onBlur={onBlur}
        onChange={(event) => onChange(normalizeTimeValue(event.target.value))}
        error={error}
      />
    )
  },
)

TimeField.displayName = 'TimeField'

export default TimeField
