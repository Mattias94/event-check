"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Input from './ui/Input'
import Button from './ui/Button'
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

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/login')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success, router])

  async function onSubmit(data: RegisterData) {
    setLoading(true)
    setSuccess(null)
    setError(null)
    try {
      const { isFirstUser } = await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        dob: data.dob,
      })

      const successMsg = isFirstUser
        ? '✅ Conta criada como ADMIN! Verifique seu e-mail.'
        : '✅ Conta criada com sucesso! Verifique seu e-mail.'
      setSuccess(successMsg)
    } catch (e: any) {
      setError(e.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-4 md:p-6 w-full">
      <h1 className="text-xl md:text-2xl font-semibold mb-6">Criar Conta</h1>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Nome Completo" name="name" placeholder="Digite seu nome completo" {...register('name')} error={errors.name?.message as string | undefined} />
        <Input label="E-mail" name="email" type="email" placeholder="Digite seu e-mail" {...register('email')} error={errors.email?.message as string | undefined} />
        <Input label="Data de Nascimento" name="dob" type="date" {...register('dob')} error={errors.dob?.message as string | undefined} />
        <Input label="Senha" name="password" type="password" placeholder="Senha" {...register('password')} error={errors.password?.message as string | undefined} />
        <Button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</Button>
      </form>

      {error && <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">{error}</div>}

      <div className="my-4 text-center text-xs md:text-sm text-slate-500">ou</div>

      <div className="mt-2">
        <button
          type="button"
          className="w-full px-3 py-3 md:py-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-base md:text-sm font-medium"
          onClick={() => router.push('/login')}
        >
          Já tem uma conta? Fazer Login
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-base md:text-lg font-medium">Esqueceu a senha?</h3>
        <p className="text-xs md:text-sm text-slate-500 mt-1">Enviaremos um link de recuperação para o seu e-mail.</p>
        <div className="mt-3">
          <button
            type="button"
            className="w-full px-3 py-3 md:py-2 rounded-md bg-sky-500 text-white hover:opacity-90 transition text-base md:text-sm font-medium"
            onClick={() => router.push('/forgot-password')}
          >
            Recuperar Senha
          </button>
        </div>
      </div>

      {success && <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm">{success}</div>}
    </div>
  )
}
