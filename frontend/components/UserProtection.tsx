'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '../lib/auth-guard'
import LoadingState from './LoadingState'

interface UserProtectionProps {
  children: React.ReactNode
  requireUserRole?: boolean
}

export default function UserProtection({ children, requireUserRole = true }: UserProtectionProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()

    if (!user) {
      router.replace('/login')
      return
    }

    if (requireUserRole && user.role === 'admin') {
      router.replace('/admin/events')
      return
    }

    setIsAuthorized(true)
    setIsLoading(false)
  }, [router, requireUserRole])

  if (isLoading) {
    return <LoadingState />
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
