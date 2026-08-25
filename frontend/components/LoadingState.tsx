'use client'

import { Skeleton } from './ui/Skeleton'

export default function LoadingState() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 shadow-sm md:p-6">
              <div className="mb-4 flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="mt-6 h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  )
}
