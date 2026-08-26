import { Suspense } from 'react'
import AuthLayout from '../../../components/AuthLayout'
import { AuthPageShell } from '../../../components/auth/AuthUi'
import VerifyEmailClient from './VerifyEmailClient'

function VerifyEmailFallback() {
  return (
    <AuthLayout>
      <AuthPageShell title="Verificação de e-mail" description="Confirmando seu cadastro no Event-Check.">
        <p className="text-center text-sm text-muted-foreground">Carregando...</p>
      </AuthPageShell>
    </AuthLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailClient />
    </Suspense>
  )
}
