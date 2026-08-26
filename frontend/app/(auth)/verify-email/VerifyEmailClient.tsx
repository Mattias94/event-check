'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthLayout from '../../../components/AuthLayout'
import Button from '../../../components/ui/Button'
import { AuthAlert, AuthPageShell } from '../../../components/auth/AuthUi'
import { verifyEmail } from '../../../lib/auth'

export default function VerifyEmailClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Link de verificação inválido.')
      setLoading(false)
      return
    }

    verifyEmail(token)
      .then((result) => {
        localStorage.setItem('authToken', result.token)
        localStorage.setItem('currentUser', JSON.stringify(result.user))
        setSuccess(result.message)
        setTimeout(() => router.push('/dashboard'), 2500)
      })
      .catch((err: any) => {
        setError(err.message || 'Não foi possível verificar o e-mail.')
      })
      .finally(() => setLoading(false))
  }, [token, router])

  return (
    <AuthLayout>
      <AuthPageShell
        title="Verificação de e-mail"
        description="Confirmando seu cadastro no Event-Check."
      >
        {loading && (
          <p className="text-center text-sm text-muted-foreground">Verificando seu e-mail...</p>
        )}

        {error && <AuthAlert variant="error">{error}</AuthAlert>}
        {success && (
          <AuthAlert variant="success">{success} Redirecionando...</AuthAlert>
        )}

        {!loading && error && (
          <Button className="mt-4 w-full" onClick={() => router.push('/login')}>
            Ir para o login
          </Button>
        )}
      </AuthPageShell>
    </AuthLayout>
  )
}
