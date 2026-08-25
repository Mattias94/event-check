import * as React from 'react'
import { cn } from '../../lib/utils'
import {
  formErrorClassName,
  formHintClassName,
  formLabelClassName,
  selectControlClassName,
} from '../../lib/form-styles'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string | null
  hint?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, name, error, hint, className, id, required, children, ...rest }, ref) => {
    const selectId = id ?? name
    const errorId = error && selectId ? `${selectId}-error` : undefined
    const hintId = hint && selectId ? `${selectId}-hint` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full min-w-0">
        {label && (
          <label htmlFor={selectId} className={formLabelClassName}>
            {label}
            {required && (
              <span className="ml-0.5 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            selectControlClassName,
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
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
  },
)
Select.displayName = 'Select'

export { Select }
export default Select
