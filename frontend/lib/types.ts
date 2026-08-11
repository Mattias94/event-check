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
  status: 'active' | 'cancelled' | 'finished'
  createdBy: string
}

export interface EnrollmentRecord {
  id: string
  userId: string
  eventId: string
  enrolledAt: string
}

export interface EventFilters {
  search?: string
  category?: string
  startDate?: string
  endDate?: string
}
