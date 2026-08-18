import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, icon, className, id, ...rest }, ref) => {
    const inputId = id ?? name
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
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
            aria-invalid={error ? true : undefined}
            className={cn(
              'flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-base shadow-sm transition-colors md:h-10 md:text-sm',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && rest.type !== 'date' && rest.type !== 'time' && 'pl-9',
              (rest.type === 'date' || rest.type === 'time') && 'date-input min-w-0 pr-3',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            {...rest}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
export default Input
