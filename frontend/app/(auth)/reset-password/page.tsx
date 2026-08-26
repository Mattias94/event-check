'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Lock, ArrowLeft } from 'lucide-react'
import AuthLayout from '../../../components/AuthLayout'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import {
  AuthAlert,
  AuthFooterLink,
  AuthPageShell,
  PasswordToggleButton,
  authFormClassName,
} from '../../../components/auth/AuthUi'
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
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
        <AuthPageShell title="Link inválido" description="Solicite um novo link de recuperação de senha.">
          <Button className="w-full" onClick={() => router.push('/forgot-password')}>
            Solicitar novo link
          </Button>
        </AuthPageShell>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthPageShell title="Nova senha" description="Defina uma nova senha para sua conta.">
        <form className={authFormClassName} onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nova senha"
            type={showNewPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            icon={<Lock />}
            {...register('newPassword')}
            error={errors.newPassword?.message}
            endAdornment={
              <PasswordToggleButton
                visible={showNewPassword}
                onToggle={() => setShowNewPassword((v) => !v)}
              />
            }
          />
          <Input
            label="Confirmar senha"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            icon={<Lock />}
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            endAdornment={
              <PasswordToggleButton
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
              />
            }
          />

          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          {success && <AuthAlert variant="success">{success}</AuthAlert>}

          <Button type="submit" className="w-full" loading={loading} disabled={!!success}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <AuthFooterLink onClick={() => router.push('/login')}>
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar ao login
            </span>
          </AuthFooterLink>
        </div>
      </AuthPageShell>
    </AuthLayout>
  )
}

function ResetPasswordFallback() {
  return (
    <AuthLayout>
      <AuthPageShell title="Carregando" description="Preparando a redefinição de senha.">
        <p className="text-center text-sm text-muted-foreground">Aguarde um momento...</p>
      </AuthPageShell>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
