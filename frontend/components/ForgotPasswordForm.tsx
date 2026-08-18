"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import Input from './ui/Input'
import Button from './ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { initiatePasswordReset } from '../lib/auth'

const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Campo obrigatório' }).email('E-mail inválido')
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
    formState: { errors }
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
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-xl md:text-2xl">Recuperar Senha</CardTitle>
        <CardDescription>Informe seu e-mail para receber um link de recuperação.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-success/20 bg-success/10 p-3 text-sm text-success"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Verifique seu e-mail</p>
                <p className="mt-1 text-xs">{success}</p>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading} disabled={!!success}>
            {loading ? 'Enviando...' : 'Recuperar senha'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline md:min-h-0"
            onClick={() => router.push('/login')}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar ao login
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
