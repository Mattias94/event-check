'use client'

import { forwardRef, useEffect, useId, useState } from 'react'
import Input from '../ui/Input'
import { formErrorClassName, formHintClassName, formLabelClassName, selectControlClassName } from '../../lib/form-styles'
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

    if (useSelects) {
      return (
        <fieldset className="w-full min-w-0 border-0 p-0">
          <legend className={formLabelClassName}>Horário</legend>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3" role="group" aria-describedby={describedBy}>
            <div className="min-w-0 overflow-hidden">
              <label htmlFor={hourId} className="sr-only">
                Hora
              </label>
              <select
                id={hourId}
                className={cn(selectControlClassName, error && 'border-destructive focus-visible:ring-destructive')}
                value={hour}
                disabled={disabled}
                onBlur={onBlur}
                aria-invalid={error ? true : undefined}
                onChange={(event) => updateTime(event.target.value, minute || '00')}
              >
                <option value="">Hora</option>
                {HOURS.map((item) => (
                  <option key={item} value={item}>
                    {item}h
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 overflow-hidden">
              <label htmlFor={minuteId} className="sr-only">
                Minuto
              </label>
              <select
                id={minuteId}
                className={cn(selectControlClassName, error && 'border-destructive focus-visible:ring-destructive')}
                value={minute}
                disabled={disabled}
                onBlur={onBlur}
                aria-invalid={error ? true : undefined}
                onChange={(event) => updateTime(hour || '00', event.target.value)}
              >
                <option value="">Min</option>
                {MINUTES.map((item) => (
                  <option key={item} value={item}>
                    {item}min
                  </option>
                ))}
              </select>
            </div>
          </div>
          {hint && !error && (
            <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">
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
