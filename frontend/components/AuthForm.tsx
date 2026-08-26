"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock } from 'lucide-react'
import Input from './ui/Input'
import DateField from './ui/DateField'
import Button from './ui/Button'
import {
  AuthAlert,
  AuthFormFooter,
  AuthPageShell,
  PasswordToggleButton,
  authFormClassName,
} from './auth/AuthUi'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUser } from '../lib/auth'
import { isIsoDateWithinBounds, normalizeDateValue, todayIsoLocal } from '../lib/date-utils'

const registerSchema = z.object({
  name: z.string({ required_error: 'Campo obrigatório' }).min(2, 'Informe seu nome completo'),
  email: z.string({ required_error: 'Campo obrigatório' }).email('E-mail inválido'),
  dob: z
    .string()
    .optional()
    .refine((value) => !value || normalizeDateValue(value) !== '', 'Data inválida. Use dd/mm/aaaa')
    .refine(
      (value) => !value || isIsoDateWithinBounds(value, undefined, todayIsoLocal()),
      'Data não pode ser no futuro',
    ),
  password: z.string({ required_error: 'Campo obrigatório' }).min(8, 'Senha deve ter no mínimo 8 caracteres'),
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
    control,
    formState: { errors },
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
    <AuthPageShell title="Criar Conta" description="Preencha seus dados para se cadastrar.">
      <form className={authFormClassName} onSubmit={handleSubmit(onSubmit)}>
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
        <Controller
          name="dob"
          control={control}
          render={({ field }) => (
            <DateField
              id="register-dob"
              ref={field.ref}
              label="Data de Nascimento"
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              max={todayIsoLocal()}
              clearable
              allowManualInput
              calendarSize="compact"
              showLabelIcon
              showFormatHint={false}
              hint="Digite dd/mm/aaaa ou use o calendário"
              error={errors.dob?.message as string | undefined}
            />
          )}
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
            <PasswordToggleButton visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          }
        />

        {error && <AuthAlert variant="error">{error}</AuthAlert>}
        {success && <AuthAlert variant="success">{success}</AuthAlert>}

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Registrando...' : 'Registrar'}
        </Button>
      </form>

      <AuthFormFooter
        alternateLabel="Já tem uma conta? Fazer Login"
        onAlternate={() => router.push('/login')}
      />
    </AuthPageShell>
  )
}
