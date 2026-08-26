'use client'

import { Eye, EyeOff } from 'lucide-react'

export function PasswordToggleButton({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      className="flex h-full w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
    >
      {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
    </button>
  )
}
