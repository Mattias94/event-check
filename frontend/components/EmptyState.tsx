'use client'

interface EmptyStateProps {
  message?: string
  icon?: string
  actionButton?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({
  message = 'Nenhum resultado encontrado',
  icon = '📭',
  actionButton
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-96 px-4">
      <div className="text-center">
        <div className="text-5xl md:text-6xl mb-4">{icon}</div>
        <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm md:text-base">{message}</p>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="px-4 py-2 md:py-2 rounded-md bg-slate-900 text-white hover:opacity-90 transition text-sm md:text-base font-medium"
          >
            {actionButton.label}
          </button>
        )}
      </div>
    </div>
  )
}
