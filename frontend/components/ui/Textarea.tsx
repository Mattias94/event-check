import * as React from 'react'
import { cn } from '../../lib/utils'
import {
  formControlClassName,
  formErrorClassName,
  formHintClassName,
  formLabelClassName,
} from '../../lib/form-styles'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string | null
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, name, error, hint, className, id, required, ...rest }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            formControlClassName,
            'min-h-[6.5rem] resize-y py-2.5',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          {...rest}
        />
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
Textarea.displayName = 'Textarea'

export { Textarea }
export default Textarea
