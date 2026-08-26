'use client'

import Button from '../ui/Button'
import { FormAlert } from '../ui/FormAlert'
import { cn } from '../../lib/utils'

export { FormAlert as AuthAlert }

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-card px-2 text-muted-foreground">ou</span>
      </div>
    </div>
  )
}

export function AuthFooterLink({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-primary transition-colors hover:underline md:min-h-0"
    >
      {children}
    </button>
  )
}

interface AuthPageShellProps {
  title: string
  description: string
  children: React.ReactNode
}

export function AuthPageShell({ title, description, children }: AuthPageShellProps) {
  return (
    <div className="w-full min-w-0 overflow-visible rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="space-y-1.5 border-b border-border/60 px-5 py-5 text-center sm:px-6 sm:py-6 md:px-8 md:py-7">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
          {title}
        </h2>
        <p className="mx-auto max-w-[18rem] text-pretty text-sm leading-relaxed text-muted-foreground sm:max-w-xs sm:text-[0.9375rem]">
          {description}
        </p>
      </div>
      <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">{children}</div>
    </div>
  )
}

export const authFormClassName = 'space-y-4 md:space-y-5'

interface AuthFormFooterProps {
  forgotPasswordHref?: () => void
  alternateLabel: string
  onAlternate: () => void
}

/** Rodapé padronizado: esqueci senha (opcional) → divisor → ação alternativa. */
export function AuthFormFooter({ forgotPasswordHref, alternateLabel, onAlternate }: AuthFormFooterProps) {
  return (
    <div className="mt-6 space-y-4">
      {forgotPasswordHref && (
        <p className="text-center">
          <AuthFooterLink onClick={forgotPasswordHref}>Esqueceu a senha?</AuthFooterLink>
        </p>
      )}

      <AuthDivider />

      <Button type="button" variant="outline" className="w-full" onClick={onAlternate}>
        {alternateLabel}
      </Button>
    </div>
  )
}

export { PasswordToggleButton } from './PasswordToggleButton'
