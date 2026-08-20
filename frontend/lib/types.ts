export interface Event {
  id: string
  title: string
  description: string
  category: string
  date: string
  time: string
  location: string
  capacity: number
  coverImageUrl?: string | null
  currentEnrollments: number
  status: 'active' | 'cancelled' | 'finished'
  createdBy: string
}

export interface EnrollmentRecord {
  id: string
  userId: string
  eventId: string
  enrolledAt: string
  checkInToken?: string
  checkedInAt?: string | null
}

export interface EnrollmentWithUser extends EnrollmentRecord {
  userName: string
  userEmail: string
}

export interface CheckInResult {
  valid: boolean
  enrollment: EnrollmentRecord | null
  participant: { id: string; name: string; email: string } | null
}

export interface EventFilters {
  search?: string
  category?: string
  startDate?: string
  endDate?: string
}
