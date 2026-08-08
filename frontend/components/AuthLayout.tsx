import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <header className="md:hidden sticky text-center top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Event-Check</h1>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="hidden md:flex items-center justify-center p-8 auth-hero rounded-lg">
            <div className="text-center text-white max-w-xs">
              <h2 className="text-2xl font-semibold mb-2">Bem-vindo ao Event-Check</h2>
              <p className="text-sm opacity-90">Crie sua conta para se inscrever em eventos e gerenciar seus ingressos.</p>
              <div className="mt-6">
                <svg width="100%" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="160" height="120" rx="10" fill="#0f172a" />
                </svg>
              </div>
            </div>
          </div>
          <div className="p-6 flex items-center justify-center">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
