'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Lock, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import AuthLayout from '../../../components/AuthLayout'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPassword } from '../../../lib/auth'

const resetSchema = z.object({
  newPassword: z.string({ required_error: 'Campo obrigatório' }).min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string({ required_error: 'Campo obrigatório' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type ResetData = z.infer<typeof resetSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetData>({ resolver: zodResolver(resetSchema) })

  async function onSubmit(data: ResetData) {
    if (!token) {
      setError('Link inválido. Solicite uma nova recuperação de senha.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await resetPassword(token, data.newPassword)
      setSuccess(result.message || 'Senha atualizada com sucesso!')
      setTimeout(() => router.push('/login'), 2500)
    } catch (e: any) {
      setError(e.message || 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <Card className="w-full">
          <CardContent className="space-y-4 pt-6 text-center">
            <p className="text-sm text-destructive">Link de recuperação inválido ou ausente.</p>
            <Button className="w-full" onClick={() => router.push('/forgot-password')}>
              Solicitar novo link
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl md:text-2xl">Nova senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              icon={<Lock />}
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />
            <Input
              label="Confirmar senha"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              icon={<Lock />}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div role="status" className="flex items-start gap-2 rounded-md border border-success/20 bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{success}</span>
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading} disabled={!!success}>
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              onClick={() => router.push('/login')}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar ao login
            </button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
