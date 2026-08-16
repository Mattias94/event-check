export type UserRole = 'admin' | 'user'
export type EventStatus = 'active' | 'cancelled' | 'finished'
export type PasswordResetStatus = 'pending' | 'used'

export interface User {
  id: string
  name: string
  email: string
  password: string
  dob?: string
  role: UserRole
}

export interface Event {
  id: string
  title: string
  description: string
  category: string
  date: string
  time: string
  location: string
  capacity: number
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
