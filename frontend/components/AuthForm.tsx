"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Input from './ui/Input'
import Button from './ui/Button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUser, getUserByEmail } from '../lib/auth'

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
      // Verificar se email já existe
      const existingUser = getUserByEmail(data.email)
      if (existingUser) {
        setError('Este e-mail já está registrado.')
        setLoading(false)
        return
      }

      await new Promise((r) => setTimeout(r, 800))

      // Criar usuário
      createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        dob: data.dob
      })

      setSuccess('Conta criada com sucesso! Verifique seu e-mail.')
    } catch (e) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold mb-4">Criar Conta</h1>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Nome Completo" name="name" placeholder="Digite seu nome completo" {...register('name')} error={errors.name?.message as string | undefined} />
        <Input label="E-mail" name="email" type="email" placeholder="Digite seu e-mail" {...register('email')} error={errors.email?.message as string | undefined} />
        <Input label="Data de Nascimento" name="dob" type="date" {...register('dob')} error={errors.dob?.message as string | undefined} />
        <Input label="Senha" name="password" type="password" placeholder="Senha" {...register('password')} error={errors.password?.message as string | undefined} />
        <Button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</Button>
      </form>

      {error && <div className="mt-4 p-3 rounded-md bg-red-50 text-red-800">{error}</div>}

      <div className="my-4 text-center text-sm text-slate-500">ou</div>

      <div className="mt-2">
        <button
          type="button"
          className="w-full py-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          onClick={() => router.push('/login')}
        >
          Ja tem uma conta? Fazer Login
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium">Esqueceu a senha?</h3>
        <p className="text-sm text-slate-500">Enviaremos um link de recuperação para o seu e-mail.</p>
        <div className="mt-3">
          <button
            type="button"
            className="w-full py-2 rounded-md bg-sky-500 text-white hover:opacity-90 transition"
            onClick={() => router.push('/forgot-password')}
          >
            Recuperar Senha
          </button>
        </div>
      </div>

      {success && <div className="mt-4 p-3 rounded-md bg-green-50 text-green-800">{success}</div>}
    </div>
  )
}
