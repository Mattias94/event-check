export type UserRole = 'admin' | 'user'
export type EventStatus = 'active' | 'cancelled' | 'finished'
export type PasswordResetStatus = 'pending' | 'used'

export interface User {
  id: string
  name: string
  email: string
  password: string
  dob?: string
  phone?: string | null
  avatarUrl?: string | null
  role: UserRole
  emailVerified: boolean
}

export interface EmailVerificationRequest {
  email: string
  token: string
  createdAt: string
  expiresAt: string
  used: boolean
}

export interface Event {
  id: string
  title: string
  description: string
  category: string
  date: string
  time: string
  location: string
  latitude?: number | null
  longitude?: number | null
  placeId?: string | null
  capacity: number
  coverImageUrl?: string | null
  currentEnrollments: number
  status: EventStatus
  createdBy: string
}

export interface EnrollmentRecord {
  id: string
  userId: string
  eventId: string
  enrolledAt: string
  checkInToken: string
  checkedInAt: string | null
}

export interface EnrollmentWithUser extends EnrollmentRecord {
  userName: string
  userEmail: string
}

export interface PasswordResetRequest {
  email: string
  token: string
  createdAt: string
  used: boolean
}

export interface EventFilters {
  search?: string
  category?: string
  startDate?: string
  endDate?: string
}
