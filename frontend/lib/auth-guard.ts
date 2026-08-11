'use client'

import { User } from './auth'

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const userJson = localStorage.getItem('currentUser')
  return userJson ? JSON.parse(userJson) : null
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

export function requireAuth(router: any): boolean {
  if (!isAuthenticated()) {
    router.push('/login')
    return false
  }
  return true
}

export function requireAdmin(router: any): boolean {
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
