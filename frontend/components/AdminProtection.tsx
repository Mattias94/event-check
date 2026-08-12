'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '../lib/auth-guard'
import LoadingState from './LoadingState'

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
      router.replace('/login')
      return
    }

    if (user.role !== 'admin') {
      router.replace('/dashboard')
      return
    }

    setIsAuthorized(true)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <LoadingState />
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
