"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft } from 'lucide-react'
import Input from './ui/Input'
import Button from './ui/Button'
import { AuthAlert, AuthFooterLink, AuthPageShell, authFormClassName } from './auth/AuthUi'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { initiatePasswordReset } from '../lib/auth'

const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Campo obrigatório' }).email('E-mail inválido'),
})

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordData) {
    setLoading(true)
    setSuccess(null)
    setError(null)
    try {
      const result = await initiatePasswordReset(data.email)
      setSuccess(result.message || `Link de recuperação enviado para ${data.email}.`)
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar link de recuperação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell
      title="Recuperar Senha"
      description="Informe seu e-mail para receber um link de recuperação."
    >
      <form className={authFormClassName} onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          icon={<Mail />}
          {...register('email')}
          error={errors.email?.message as string | undefined}
        />

        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        {success && (
          <AuthAlert variant="success" title="Verifique seu e-mail">
            {success}
          </AuthAlert>
        )}

        <Button type="submit" className="w-full" loading={loading} disabled={!!success}>
          {loading ? 'Enviando...' : 'Recuperar senha'}
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
  )
}
