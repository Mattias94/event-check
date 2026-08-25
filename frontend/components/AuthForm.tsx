"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import Input from './ui/Input'
import Button from './ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUser } from '../lib/auth'

const registerSchema = z.object({
  name: z.string({ required_error: 'Campo obrigatório' }).min(2, 'Informe seu nome completo'),
  email: z.string({ required_error: 'Campo obrigatório' }).email('E-mail inválido'),
  dob: z.string().optional(),
  password: z.string({ required_error: 'Campo obrigatório' }).min(8, 'Senha deve ter no mínimo 8 caracteres')
})

type RegisterData = z.infer<typeof registerSchema>

export default function AuthForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterData) {
    setLoading(true)
    setSuccess(null)
    setError(null)
    try {
      const result = await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        dob: data.dob,
      })

      if (result.token) {
        localStorage.setItem('authToken', result.token)
        localStorage.setItem('currentUser', JSON.stringify(result.user))
      }

      const successMsg = result.message ?? 'Conta criada com sucesso! Você já pode fazer login.'
      setSuccess(successMsg)

      if (result.token && result.isFirstUser) {
        setTimeout(() => router.push('/admin/events'), 2000)
        return
      }

      if (result.token && result.user.role === 'user') {
        setTimeout(() => router.push('/dashboard'), 2000)
        return
      }

      setTimeout(() => router.push('/login'), 4000)
    } catch (e: any) {
      setError(e.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-xl md:text-2xl">Criar Conta</CardTitle>
        <CardDescription>Preencha seus dados para se cadastrar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nome Completo"
            name="name"
            autoComplete="name"
            placeholder="Digite seu nome completo"
            icon={<User />}
            {...register('name')}
            error={errors.name?.message as string | undefined}
          />
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
            label="Data de Nascimento"
            name="dob"
            type="date"
            className="date-input"
            {...register('dob')}
            error={errors.dob?.message as string | undefined}
          />

          <Input
            label="Senha"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
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
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-success/20 bg-success/10 p-3 text-sm text-success"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{success}</span>
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            {loading ? 'Registrando...' : 'Registrar'}
          </Button>
        </form>

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
          onClick={() => router.push('/login')}
        >
          Já tem uma conta? Fazer Login
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Esqueceu a senha?{' '}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => router.push('/forgot-password')}
          >
            Recuperar Senha
          </button>
        </p>
      </CardContent>
    </Card>
  )
}
