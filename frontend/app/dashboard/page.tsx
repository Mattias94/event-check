'use client'

import React from 'react'
import UserProtection from '../../components/UserProtection'
import DashboardClient from '../../components/DashboardClient'

export default function DashboardPage() {
  return (
    <UserProtection>
      <DashboardClient />
    </UserProtection>
  )
}

