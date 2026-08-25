import * as React from 'react'
import { cn } from '../../lib/utils'
import { formControlClassName, formErrorClassName, formHintClassName, formLabelClassName } from '../../lib/form-styles'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
  hint?: string
  icon?: React.ReactNode
  endAdornment?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, hint, icon, endAdornment, className, id, required, ...rest }, ref) => {
    const inputId = id ?? name
    const errorId = error && inputId ? `${inputId}-error` : undefined
    const hintId = hint && inputId ? `${inputId}-hint` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full min-w-0">
        {label && (
          <label htmlFor={inputId} className={formLabelClassName}>
            {label}
            {required && (
              <span className="ml-0.5 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            name={name}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            className={cn(
              formControlClassName,
              'shadow-sm',
              icon && rest.type !== 'date' && rest.type !== 'time' && 'pl-9',
              (rest.type === 'date' || rest.type === 'time') && 'date-input min-w-0 pr-3',
              endAdornment && 'pr-11',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            {...rest}
          />
          {endAdornment && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              {endAdornment}
            </div>
          )}
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
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
export default Input
