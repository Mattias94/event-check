'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '../lib/auth-guard'

interface UserProtectionProps {
  children: React.ReactNode
  requireUserRole?: boolean
}

export default function UserProtection({ children, requireUserRole = true }: UserProtectionProps) {
  const router = useRouter()
  const user = getCurrentUser()
  const isAuthorized = Boolean(user) && (!requireUserRole || user?.role === 'user')

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    if (requireUserRole && user.role === 'admin') {
      router.replace('/admin/events')
    }
  }, [user, router, requireUserRole])

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
