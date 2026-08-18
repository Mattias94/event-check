'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthLayout from '../../../components/AuthLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { verifyEmail } from '../../../lib/auth'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

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
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl md:text-2xl">Verificação de e-mail</CardTitle>
          <CardDescription>Confirmando seu cadastro no Event Check</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {loading && <p className="text-sm text-muted-foreground">Verificando...</p>}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-left text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div role="status" className="flex items-start gap-2 rounded-md border border-success/20 bg-success/10 p-3 text-left text-sm text-success">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{success} Redirecionando...</span>
            </div>
          )}

          {!loading && error && (
            <Button className="w-full" onClick={() => router.push('/login')}>
              Ir para o login
            </Button>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
