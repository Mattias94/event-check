import { Suspense } from 'react'
import VerifyEmailClient from './VerifyEmailClient'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>}>
      <VerifyEmailClient />
    </Suspense>
  )
}
