"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from './ui/Input'
import Button from './ui/Button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifyCredentials } from '../lib/auth'

const loginSchema = z.object({
  email: z.string({ required_error: 'Campo obrigatório' }).email('E-mail inválido'),
  password: z.string({ required_error: 'Campo obrigatório' }).min(1, 'Senha obrigatória')
})

type LoginData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginData) {
    setLoading(true)
    setError(null)
    try {
      const user = await verifyCredentials(data.email, data.password)
      if (!user) {
        setError('E-mail ou senha inválidos.')
        setLoading(false)
        return
      }

      localStorage.setItem('currentUser', JSON.stringify(user))

      if (user.role === 'admin') {
        router.push('/admin/events')
      } else {
        router.push('/dashboard')
      }
    } catch (e) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-4 md:p-6 w-full">
      <h1 className="text-xl md:text-2xl font-semibold mb-6">Fazer Login</h1>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="E-mail"
          name="email"
          type="email"
          placeholder="Digite seu e-mail"
          {...register('email')}
          error={errors.email?.message as string | undefined}
        />
        <Input
          label="Senha"
          name="password"
          type="password"
          placeholder="Digite sua senha"
          {...register('password')}
          error={errors.password?.message as string | undefined}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Login'}
        </Button>
      </form>

      {error && <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">{error}</div>}

      <div className="my-4 text-center text-xs md:text-sm text-slate-500">ou</div>

      <div className="mt-2">
        <button
          type="button"
          className="w-full px-3 py-3 md:py-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-base md:text-sm font-medium"
          onClick={() => router.push('/register')}
        >
          Ainda não tem conta? Registre-se
        </button>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="w-full text-sm text-sky-500 hover:underline transition py-2"
          onClick={() => router.push('/forgot-password')}
        >
          Esqueceu a senha?
        </button>
      </div>
    </div>
  )
}
