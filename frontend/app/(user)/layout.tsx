'use client'

import { ReactNode } from 'react'
import UserProtection from '../../components/UserProtection'
import UserShell from '../../components/user/UserShell'

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <UserProtection>
      <UserShell>{children}</UserShell>
    </UserProtection>
  )
}
