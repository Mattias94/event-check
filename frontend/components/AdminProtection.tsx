'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { getCurrentUser } from '../lib/auth-guard'
import { Skeleton } from './ui/Skeleton'

interface AdminProtectionProps {
  children: React.ReactNode
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()

    if (!user) {
      setIsLoading(false)
      router.replace('/login')
      return
    }

    if (user.role !== 'admin') {
      setIsLoading(false)
      router.replace('/dashboard')
      return
    }

    setIsAuthorized(true)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Shield className="size-6" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        <div className="w-full max-w-xs space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mx-auto h-3 w-2/3" />
        </div>
        <span className="sr-only">Carregando...</span>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
