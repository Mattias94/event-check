"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock } from 'lucide-react'
import Input from './ui/Input'
import Button from './ui/Button'
import {
  AuthAlert,
  AuthFormFooter,
  AuthPageShell,
  PasswordToggleButton,
  authFormClassName,
} from './auth/AuthUi'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifyCredentials, resendVerificationEmail } from '../lib/auth'

const loginSchema = z.object({
  email: z.string({ required_error: 'Campo obrigatório' }).email('E-mail inválido'),
  password: z.string({ required_error: 'Campo obrigatório' }).min(1, 'Senha obrigatória'),
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
    formState: { errors },
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
    <AuthPageShell title="Fazer Login" description="Acesse sua conta para continuar.">
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
            <PasswordToggleButton visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          }
        />

        {error && (
          <AuthAlert variant="error">
            <span>{error}</span>
            {pendingEmail && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                loading={resending}
                onClick={handleResendVerification}
              >
                Reenviar e-mail de verificação
              </Button>
            )}
          </AuthAlert>
        )}

        {resendMessage && <AuthAlert variant="success">{resendMessage}</AuthAlert>}

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <AuthFormFooter
        forgotPasswordHref={() => router.push('/forgot-password')}
        alternateLabel="Ainda não tem conta? Registre-se"
        onAlternate={() => router.push('/register')}
      />
    </AuthPageShell>
  )
}
