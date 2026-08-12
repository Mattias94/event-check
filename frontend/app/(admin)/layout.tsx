import { ReactNode } from 'react'
import AdminProtection from '../../components/AdminProtection'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtection>
      {children}
    </AdminProtection>
  )
}

