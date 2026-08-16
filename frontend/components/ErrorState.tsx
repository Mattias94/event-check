'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './ui/Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Ocorreu um erro ao carregar os dados', onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-96 items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        </div>
        <p className="font-medium text-foreground md:text-base">{message}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Verifique sua conexão e tente novamente.
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-6">
            <RefreshCw aria-hidden="true" />
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  )
}
