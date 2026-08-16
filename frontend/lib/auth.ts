import { api } from './api'

export interface User {
  id: string
  name: string
  email: string
  dob?: string
  role: 'admin' | 'user'
}

export interface RegisterData {
  name: string
  email: string
  password: string
  dob?: string
}

export interface RegisterResult {
  user: User
  isFirstUser: boolean
  token: string
}

/** Usuário autenticado + token de sessão retornados pelo login. */
export type LoginResult = User & { token: string }

/**
 * Autentica o usuário contra a API. Retorna null quando as
 * credenciais são inválidas em vez de propagar o erro HTTP.
 */
export async function verifyCredentials(email: string, password: string): Promise<LoginResult | null> {
  try {
    return await api.post<LoginResult>('/auth/login', { email, password })
  } catch {
    return null
  }
}

/**
 * Registra um novo usuário. O backend decide se ele será admin
 * (primeiro usuário do sistema) ou usuário comum.
 */
export async function createUser(userData: RegisterData): Promise<RegisterResult> {
  return api.post<RegisterResult>('/auth/register', userData)
}

/**
 * Busca os dados públicos de um usuário pelo ID.
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    return await api.get<User>(`/users/${userId}`)
  } catch {
    return null
  }
}

export async function initiatePasswordReset(email: string): Promise<boolean> {
  try {
    await api.post('/auth/forgot-password', { email })
    return true
  } catch {
    return false
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    await api.post('/auth/reset-password', { token, newPassword })
    return true
  } catch {
    return false
  }
}
