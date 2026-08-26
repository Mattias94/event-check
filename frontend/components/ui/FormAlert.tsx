'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface FormAlertProps {
  variant: 'error' | 'success' | 'warning'
  title?: string
  children: React.ReactNode
  className?: string
}

export function FormAlert({ variant, title, children, className }: FormAlertProps) {
  const styles = {
    error: 'border-destructive/20 bg-destructive/10 text-destructive',
    success: 'border-success/20 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
  } as const

  const Icon = variant === 'error' ? AlertCircle : CheckCircle2

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-md border p-3 text-sm', styles[variant], className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 break-words">
        {title ? (
          <>
            <p className="font-medium">{title}</p>
            <div className="mt-1 text-xs">{children}</div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
