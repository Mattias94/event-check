'use client'

import { User } from './auth'

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null

  try {
    const userJson = localStorage.getItem('currentUser')
    if (!userJson) return null
    return JSON.parse(userJson) as User
  } catch {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    return null
  }
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

export function isUser(): boolean {
  const user = getCurrentUser()
  return user?.role === 'user'
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

export function requireAuth(router: { push: (path: string) => void }): boolean {
  if (!isAuthenticated()) {
    router.push('/login')
    return false
  }
  return true
}

export function requireAdmin(router: { push: (path: string) => void }): boolean {
  if (!isAdmin()) {
    router.push('/dashboard')
    return false
  }
  return true
}

export function getCurrentUserId(): string | null {
  const user = getCurrentUser()
  return user?.id || null
}
