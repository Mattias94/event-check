"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Input from './ui/Input'
import Button from './ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifyCredentials, resendVerificationEmail } from '../lib/auth'

const loginSchema = z.object({
  email: z.string({ required_error: 'Campo obrigatório' }).email('E-mail inválido'),
  password: z.string({ required_error: 'Campo obrigatório' }).min(1, 'Senha obrigatória')
})

type LoginData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginData) {
    setLoading(true)
    setError(null)
    setResendMessage(null)
    setPendingEmail(null)
    try {
      const result = await verifyCredentials(data.email, data.password)
      if (!result) {
        setError('E-mail ou senha incorretos.')
        setLoading(false)
        return
      }

      const { token, ...user } = result
      localStorage.setItem('authToken', token)
      localStorage.setItem('currentUser', JSON.stringify(user))

      if (user.role === 'admin') {
        router.push('/admin/events')
      } else {
        router.push('/dashboard')
      }
    } catch (e: any) {
      const message = e.message || 'Erro ao fazer login. Tente novamente.'
      setError(message)
      if (message.toLowerCase().includes('não verificado')) {
        setPendingEmail(data.email)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!pendingEmail) return
    setResending(true)
    setResendMessage(null)
    try {
      const result = await resendVerificationEmail(pendingEmail)
      setResendMessage(result.message)
    } catch (e: any) {
      setResendMessage(e.message || 'Não foi possível reenviar o e-mail.')
    } finally {
      setResending(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-xl md:text-2xl">Fazer Login</CardTitle>
        <CardDescription>Acesse sua conta para continuar.</CardDescription>
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

          <Input
            label="Senha"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            icon={<Lock />}
            {...register('password')}
            error={errors.password?.message as string | undefined}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="flex h-full w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="space-y-2">
                <span>{error}</span>
                {pendingEmail && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    loading={resending}
                    onClick={handleResendVerification}
                  >
                    Reenviar e-mail de verificação
                  </Button>
                )}
              </div>
            </div>
          )}

          {resendMessage && (
            <div role="status" className="rounded-md border border-success/20 bg-success/10 p-3 text-sm text-success">
              {resendMessage}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            {loading ? 'Entrando...' : 'Login'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => router.push('/forgot-password')}
          >
            Esqueceu a senha?
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => router.push('/register')}
        >
          Ainda não tem conta? Registre-se
        </Button>
      </CardContent>
    </Card>
  )
}
