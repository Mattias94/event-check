'use client'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Ocorreu um erro ao carregar os dados', onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-96 px-4">
      <div className="text-center">
        <div className="text-5xl md:text-6xl mb-4">⚠️</div>
        <p className="text-slate-900 dark:text-white mb-4 font-medium text-sm md:text-base">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 md:py-2 rounded-md bg-slate-900 text-white hover:opacity-90 transition text-sm md:text-base font-medium"
          >
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  )
}
