'use client'

export default function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-96 px-4">
      <div className="text-center">
        <div className="inline-block">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-white rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-sm md:text-base text-slate-600 dark:text-slate-400">Carregando...</p>
      </div>
    </div>
  )
}
