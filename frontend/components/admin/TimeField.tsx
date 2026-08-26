'use client'

import { forwardRef, useEffect, useId, useState } from 'react'
import { Clock } from 'lucide-react'
import {
  formErrorClassName,
  formHintClassName,
  formLabelClassName,
  selectControlClassName,
} from '../../lib/form-styles'
import { cn } from '../../lib/utils'

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

export function normalizeTimeValue(value: string): string {
  if (!value) return ''
  const match = value.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

/** Exibe horário no padrão brasileiro (24 h, ex.: 14:30). */
export function formatTimePtBr(value: string): string {
  return normalizeTimeValue(value)
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
    const hourId = `${groupId}-hour`
    const minuteId = `${groupId}-minute`
    const errorId = error ? `${groupId}-error` : undefined
    const hintId = `${groupId}-hint`
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    const normalized = normalizeTimeValue(value)
    const [hour, setHour] = useState('')
    const [minute, setMinute] = useState('')

    useEffect(() => {
      if (normalized) {
        const [h, m] = normalized.split(':')
        setHour(h)
        setMinute(m)
      } else {
        setHour('')
        setMinute('')
      }
    }, [normalized])

    function commitTime(nextHour: string, nextMinute: string) {
      if (nextHour && nextMinute) {
        onChange(`${nextHour}:${nextMinute}`)
      } else if (!nextHour && !nextMinute) {
        onChange('')
      }
    }

    function handleHourChange(nextHour: string) {
      setHour(nextHour)
      commitTime(nextHour, minute)
    }

    function handleMinuteChange(nextMinute: string) {
      setMinute(nextMinute)
      commitTime(hour, nextMinute)
    }

    const selectClassName = cn(
      selectControlClassName,
      error && 'border-destructive focus-visible:ring-destructive',
    )

    return (
      <fieldset className="w-full min-w-0 border-0 p-0">
        <input
          ref={ref}
          type="hidden"
          name="time"
          value={normalized}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
        />

        <legend className={cn(formLabelClassName, 'flex items-center gap-1.5')}>
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          Horário
        </legend>

        <div
          className="flex min-w-0 items-center gap-2"
          role="group"
          aria-describedby={describedBy}
        >
          <select
            id={hourId}
            value={hour}
            disabled={disabled}
            aria-label="Hora (00 a 23)"
            aria-invalid={error ? true : undefined}
            onBlur={onBlur}
            onChange={(event) => handleHourChange(event.target.value)}
            className={cn(selectClassName, 'min-w-0 flex-1')}
          >
            <option value="">Hora</option>
            {HOURS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <span className="shrink-0 text-lg font-medium text-muted-foreground" aria-hidden="true">
            :
          </span>

          <select
            id={minuteId}
            value={minute}
            disabled={disabled}
            aria-label="Minuto (00 a 59)"
            aria-invalid={error ? true : undefined}
            onBlur={onBlur}
            onChange={(event) => handleMinuteChange(event.target.value)}
            className={cn(selectClassName, 'min-w-0 flex-1')}
          >
            <option value="">Min</option>
            {MINUTES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {!error && (
          <p id={hintId} className={formHintClassName}>
            {hint ?? 'Formato 24 horas (ex.: 14:30)'}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className={formErrorClassName}>
            {error}
          </p>
        )}
      </fieldset>
    )
  },
)

TimeField.displayName = 'TimeField'

export default TimeField
