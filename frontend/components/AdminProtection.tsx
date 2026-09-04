'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '../lib/auth-guard'

interface AdminProtectionProps {
  children: React.ReactNode
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const router = useRouter()
  const user = getCurrentUser()
  const isAuthorized = user?.role === 'admin'

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    if (user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [user, router])

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
