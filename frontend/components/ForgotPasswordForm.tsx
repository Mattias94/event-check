"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Input from './ui/Input'
import Button from './ui/Button'
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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/login')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, router])

  async function onSubmit(data: ForgotPasswordData) {
    setLoading(true)
    setSuccess(null)
    setError(null)
    try {
      const result = await initiatePasswordReset(data.email)
      if (!result) {
        setError('E-mail não encontrado em nosso sistema.')
        setLoading(false)
        return
      }

      setSuccess(`Link de recuperação enviado para ${data.email}. Redirecionando para login...`)
    } catch (e) {
      setError('Erro ao enviar link de recuperação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-4 md:p-6 w-full">
      <h1 className="text-xl md:text-2xl font-semibold mb-2">Recuperar Senha</h1>
      <p className="text-xs md:text-sm text-slate-500 mb-6">Informe seu e-mail para receber um link de recuperação.</p>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="E-mail"
          name="email"
          type="email"
          placeholder="Digite seu e-mail"
          {...register('email')}
          error={errors.email?.message as string | undefined}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Obter Link de Recuperação'}
        </Button>
      </form>

      {error && <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">{error}</div>}

      <div className="mt-4">
        <button
          type="button"
          className="w-full text-xs md:text-sm text-slate-600 dark:text-slate-400 hover:underline transition py-2"
          onClick={() => router.push('/login')}
        >
          Voltar ao login
        </button>
      </div>

      {success && (
        <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm">
          <p className="font-medium">✓ Sucesso!</p>
          <p className="text-xs mt-1">{success}</p>
        </div>
      )}
    </div>
  )
}
