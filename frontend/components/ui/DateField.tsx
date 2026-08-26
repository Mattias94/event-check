'use client'

import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronDown, X } from 'lucide-react'
import Calendar from './Calendar'
import {
  formControlClassName,
  formErrorClassName,
  formHintClassName,
  formLabelClassName,
  formPanelClassName,
} from '../../lib/form-styles'
import {
  formatDateInputMaskFromDigits,
  formatDatePtBr,
  isIsoDateWithinBounds,
  normalizeDateValue,
  parseDatePtBrInput,
  parseIsoDateLocal,
  todayIsoLocal,
} from '../../lib/date-utils'
import { cn } from '../../lib/utils'

export interface DateFieldProps {
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  hint?: string
  min?: string
  max?: string
  label?: string
  placeholder?: string
  required?: boolean
  clearable?: boolean
  showFormatHint?: boolean
  allowManualInput?: boolean
  calendarSize?: 'default' | 'compact'
  showLabelIcon?: boolean
  compact?: boolean
  id?: string
  name?: string
}

interface PanelPosition {
  top: number
  left: number
  width: number
}

const PANEL_ESTIMATED_HEIGHT = {
  default: 360,
  compact: 270,
} as const

const PANEL_WIDTH = {
  default: { mobile: 320, min: 300 },
  compact: { mobile: 252, min: 252 },
} as const
const VIEWPORT_PADDING = 8

function getInitialView(value: string) {
  const normalized = normalizeDateValue(value)
  const parsed = parseIsoDateLocal(normalized)
  const today = parseIsoDateLocal(todayIsoLocal())!

  if (parsed) {
    return { year: parsed.getFullYear(), month: parsed.getMonth() + 1 }
  }

  return { year: today.getFullYear(), month: today.getMonth() + 1 }
}

function getManualInputError(value: string, min?: string, max?: string): string | null {
  if (!value.trim()) return null

  const parsed = parseDatePtBrInput(value)
  if (parsed === null) return 'Data inválida. Use dd/mm/aaaa'
  if (parsed && !isIsoDateWithinBounds(parsed, min, max)) {
    if (max && parsed > max) return 'Data posterior ao permitido'
    if (min && parsed < min) return 'Data anterior ao permitido'
  }
  return null
}

function computePanelPosition(anchor: HTMLElement, calendarSize: 'default' | 'compact' = 'default'): PanelPosition {
  const rect = anchor.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const isCompact = viewportWidth < 640
  const sizeConfig = PANEL_WIDTH[calendarSize]
  const estimatedHeight = PANEL_ESTIMATED_HEIGHT[calendarSize]

  const width = isCompact
    ? Math.min(sizeConfig.mobile, viewportWidth - VIEWPORT_PADDING * 2)
    : Math.min(Math.max(rect.width, sizeConfig.min), viewportWidth - VIEWPORT_PADDING * 2)

  let left = isCompact
    ? (viewportWidth - width) / 2
    : rect.left

  if (!isCompact && left + width > viewportWidth - VIEWPORT_PADDING) {
    left = viewportWidth - VIEWPORT_PADDING - width
  }
  left = Math.max(VIEWPORT_PADDING, left)

  const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING
  const openBelow = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove

  const top = openBelow
    ? Math.min(rect.bottom + 6, viewportHeight - estimatedHeight - VIEWPORT_PADDING)
    : Math.max(VIEWPORT_PADDING, rect.top - estimatedHeight - 6)

  return { top, left, width }
}

const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      value = '',
      onChange,
      onBlur,
      error,
      disabled,
      hint,
      min,
      max,
      label = 'Data',
      placeholder = 'Selecione a data',
      required,
      clearable = false,
      showFormatHint = true,
      allowManualInput = false,
      calendarSize = 'default',
      showLabelIcon = false,
      compact = false,
      id,
      name = 'date',
    },
    ref,
  ) => {
    const generatedId = useId()
    const manualInputId = id ?? `${generatedId}-input`
    const triggerId = `${generatedId}-trigger`
    const panelId = `${generatedId}-panel`
    const errorId = error ? `${generatedId}-error` : undefined
    const hintId = `${generatedId}-hint`
    const showHint = Boolean((hint || showFormatHint) && !error)
    const describedBy = [showHint ? hintId : undefined, errorId].filter(Boolean).join(' ') || undefined

    const normalized = normalizeDateValue(value)
    const displayValue = formatDatePtBr(normalized)
    const containerRef = useRef<HTMLDivElement>(null)
    const anchorRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [open, setOpen] = useState(false)
    const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null)
    const [textValue, setTextValue] = useState(displayValue)
    const [isEditingManual, setIsEditingManual] = useState(false)
    const [manualError, setManualError] = useState<string | null>(null)
    const initialView = getInitialView(normalized)
    const [viewYear, setViewYear] = useState(initialView.year)
    const [viewMonth, setViewMonth] = useState(initialView.month)

    const resolvedError = error ?? manualError

    const updatePanelPosition = useCallback(() => {
      if (!anchorRef.current) return
      setPanelPosition(computePanelPosition(anchorRef.current, calendarSize))
    }, [calendarSize])

    useEffect(() => {
      setMounted(true)
    }, [])

    useEffect(() => {
      const nextView = getInitialView(normalized)
      setViewYear(nextView.year)
      setViewMonth(nextView.month)
    }, [normalized])

    useEffect(() => {
      if (!allowManualInput || isEditingManual) return
      setTextValue(displayValue)
      setManualError(null)
    }, [allowManualInput, displayValue, isEditingManual])

    useLayoutEffect(() => {
      if (!open) return
      updatePanelPosition()
    }, [open, updatePanelPosition])

    useEffect(() => {
      if (!open) {
        document.body.style.removeProperty('overflow')
        return
      }

      document.body.style.overflow = 'hidden'

      function handlePointerDown(event: MouseEvent) {
        const target = event.target as Node
        if (containerRef.current?.contains(target)) return
        if (panelRef.current?.contains(target)) return
        setOpen(false)
        onBlur?.()
      }

      function handleEscape(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          setOpen(false)
          onBlur?.()
        }
      }

      function handleReposition() {
        updatePanelPosition()
      }

      document.addEventListener('mousedown', handlePointerDown)
      document.addEventListener('keydown', handleEscape)
      window.addEventListener('resize', handleReposition)
      window.addEventListener('scroll', handleReposition, true)
      return () => {
        document.body.style.removeProperty('overflow')
        document.removeEventListener('mousedown', handlePointerDown)
        document.removeEventListener('keydown', handleEscape)
        window.removeEventListener('resize', handleReposition)
        window.removeEventListener('scroll', handleReposition, true)
      }
    }, [open, onBlur, updatePanelPosition])

    function handleSelect(nextValue: string) {
      onChange(nextValue)
      setTextValue(formatDatePtBr(nextValue))
      setManualError(null)
      setIsEditingManual(false)
      setOpen(false)
      onBlur?.()
    }

    function handleClear() {
      onChange('')
      setTextValue('')
      setManualError(null)
      setIsEditingManual(false)
      setOpen(false)
      onBlur?.()
    }

    function handleMonthChange(year: number, month: number) {
      setViewYear(year)
      setViewMonth(month)
    }

    function commitManualInput(rawValue: string) {
      if (!rawValue.trim()) {
        onChange('')
        setManualError(null)
        return
      }

      const parsed = parseDatePtBrInput(rawValue)
      const nextManualError = getManualInputError(rawValue, min, max)

      if (parsed === null || nextManualError) {
        setManualError(nextManualError ?? 'Data inválida. Use dd/mm/aaaa')
        return
      }

      onChange(parsed)
      setTextValue(formatDatePtBr(parsed))
      setManualError(null)
    }

    function handleManualChange(event: React.ChangeEvent<HTMLInputElement>) {
      const digits = event.target.value.replace(/\D/g, '').slice(0, 8)
      const masked = formatDateInputMaskFromDigits(digits)
      setTextValue(masked)
      setIsEditingManual(true)
      setManualError(null)

      if (!digits) {
        onChange('')
        return
      }

      if (digits.length === 8) {
        commitManualInput(masked)
      }
    }

    function handleManualBlur() {
      setIsEditingManual(false)
      commitManualInput(textValue)
      onBlur?.()
    }

    function toggleCalendar() {
      if (!disabled) {
        if (!open && anchorRef.current) {
          setPanelPosition(computePanelPosition(anchorRef.current, calendarSize))
        }
        setOpen((current) => !current)
      }
    }

    const controlErrorClassName = resolvedError
      ? 'border-destructive focus-visible:ring-destructive'
      : undefined

    const triggerClassName = cn(
      formControlClassName,
      'flex items-center justify-between gap-2 text-left',
      !displayValue && 'text-muted-foreground',
      compact && 'h-11 min-h-11 border-border/60 bg-background/80 py-2 text-sm shadow-none md:h-9 md:min-h-0 md:py-1.5',
      controlErrorClassName,
    )

    const manualInputClassName = cn(
      formControlClassName,
      'min-w-0 flex-1 tabular-nums',
      compact && 'h-11 min-h-11 border-border/60 bg-background/80 py-2 text-sm shadow-none md:h-9 md:min-h-0 md:py-1.5',
      controlErrorClassName,
    )

    const iconButtonClassName = cn(
      'inline-flex shrink-0 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
      compact ? 'size-11 md:size-9' : 'size-11 md:size-10',
    )

    const labelClassName = compact ? 'mb-1 block text-xs font-medium text-muted-foreground' : formLabelClassName

    const calendarPanel =
      open && !disabled && panelPosition ? (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[90] bg-black/25"
            onMouseDown={() => {
              setOpen(false)
              onBlur?.()
            }}
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={`Calendário — ${label}`}
            style={{
              position: 'fixed',
              top: panelPosition.top,
              left: panelPosition.left,
              width: panelPosition.width,
              zIndex: 100,
            }}
            className={cn(
              formPanelClassName,
              'overflow-y-auto shadow-xl',
              calendarSize === 'compact'
                ? 'max-h-[min(17rem,calc(100dvh-2rem))] rounded-lg p-2.5'
                : 'max-h-[min(22rem,calc(100dvh-2rem))] p-3',
            )}
          >
            <Calendar
              value={normalized}
              min={min}
              max={max}
              month={viewMonth}
              year={viewYear}
              onMonthChange={handleMonthChange}
              onSelect={handleSelect}
              size={calendarSize}
            />
          </div>
        </>
      ) : null

    return (
      <div ref={containerRef} className="relative w-full min-w-0">
        <input
          ref={ref}
          type="hidden"
          name={name}
          value={normalized}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
        />

        <label
          htmlFor={allowManualInput ? manualInputId : triggerId}
          className={labelClassName}
        >
          <span className="inline-flex items-center gap-1.5">
            {showLabelIcon && (
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            {label}
            {required && (
              <span className="ml-0.5 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </span>
        </label>

        <div ref={anchorRef} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
          {allowManualInput ? (
            <input
              id={manualInputId}
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              disabled={disabled}
              value={textValue}
              placeholder="dd/mm/aaaa"
              aria-invalid={resolvedError ? true : undefined}
              aria-describedby={describedBy}
              aria-required={required || undefined}
              onChange={handleManualChange}
              onBlur={handleManualBlur}
              className={cn(manualInputClassName, 'w-full sm:min-w-0 sm:flex-1')}
            />
          ) : (
            <button
              id={triggerId}
              type="button"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={panelId}
              aria-invalid={resolvedError ? true : undefined}
              aria-describedby={describedBy}
              aria-required={required || undefined}
              onClick={toggleCalendar}
              className={cn(triggerClassName, 'min-w-0 flex-1')}
            >
              <span className="truncate">{displayValue || placeholder}</span>
              <ChevronDown
                className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
          )}

          <div className={cn('flex shrink-0 items-stretch gap-2', allowManualInput && 'w-full sm:w-auto')}>
          {allowManualInput && (
            <button
              id={triggerId}
              type="button"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label="Abrir calendário"
              onClick={toggleCalendar}
              className={cn(iconButtonClassName, allowManualInput && 'flex-1 sm:flex-none')}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
            </button>
          )}

          {clearable && normalized && !disabled && (
            <button
              type="button"
              aria-label="Limpar data"
              onClick={handleClear}
              className={cn(iconButtonClassName, allowManualInput && 'flex-1 sm:flex-none')}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
          </div>
        </div>

        {mounted && calendarPanel ? createPortal(calendarPanel, document.body) : null}

        {showHint && (
          <p id={hintId} className={formHintClassName}>
            {hint ?? (allowManualInput ? 'Digite ou selecione no calendário (dd/mm/aaaa)' : 'Formato brasileiro (dd/MM/aaaa)')}
          </p>
        )}
        {resolvedError && (
          <p id={errorId} role="alert" className={formErrorClassName}>
            {resolvedError}
          </p>
        )}
      </div>
    )
  },
)

DateField.displayName = 'DateField'

export default DateField
