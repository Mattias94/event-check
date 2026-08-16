'use client'

import type { LucideIcon } from 'lucide-react'
import { CalendarX2, ClipboardList, Inbox, Search, UserRound, Users } from 'lucide-react'
import { Button } from './ui/Button'

interface EmptyStateProps {
  message?: string
  icon?: string
  actionButton?: {
    label: string
    onClick: () => void
  }
}

// Mapeia os ícones (emojis legados) para ícones lucide equivalentes
const ICON_MAP: Record<string, LucideIcon> = {
  '📭': Inbox,
  '📋': ClipboardList,
  '👤': UserRound,
  '👥': Users,
  '🔍': Search,
  '📅': CalendarX2,
  '🗓️': CalendarX2,
}

export default function EmptyState({
  message = 'Nenhum resultado encontrado',
  icon = '📭',
  actionButton
}: EmptyStateProps) {
  const Icon = ICON_MAP[icon] ?? Inbox

  return (
    <div className="flex min-h-96 items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground md:text-base">{message}</p>
        {actionButton && (
          <Button onClick={actionButton.onClick} className="mt-6">
            {actionButton.label}
          </Button>
        )}
      </div>
    </div>
  )
}
