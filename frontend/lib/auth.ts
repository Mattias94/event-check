import { api } from './api'

export interface User {
  id: string
  name: string
  email: string
  dob?: string
  phone?: string | null
  avatarUrl?: string | null
  role: 'admin' | 'user'
  emailVerified?: boolean
}

export interface UpdateProfileData {
  name?: string
  phone?: string | null
  avatarUrl?: string | null
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
  token?: string
  emailSent?: boolean
  message?: string
}

export interface AuthMessageResult {
  message: string
  emailSent?: boolean
}

/** Usuário autenticado + token de sessão retornados pelo login. */
export type LoginResult = User & { token: string }

export async function verifyCredentials(email: string, password: string): Promise<LoginResult | null> {
  try {
    return await api.post<LoginResult>('/auth/login', { email, password })
  } catch (err: any) {
    if (err?.message) throw err
    return null
  }
}

export async function createUser(userData: RegisterData): Promise<RegisterResult> {
  return api.post<RegisterResult>('/auth/register', userData)
}

export async function verifyEmail(token: string): Promise<{ message: string; user: User; token: string }> {
  return api.post('/auth/verify-email', { token })
}

export async function resendVerificationEmail(email: string): Promise<AuthMessageResult> {
  return api.post<AuthMessageResult>('/auth/resend-verification', { email })
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    return await api.get<User>(`/users/${userId}`)
  } catch {
    return null
  }
}

export async function initiatePasswordReset(email: string): Promise<AuthMessageResult> {
  return api.post<AuthMessageResult>('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, newPassword: string): Promise<AuthMessageResult> {
  return api.post<AuthMessageResult>('/auth/reset-password', { token, newPassword })
}

export async function updateUserProfile(userId: string, data: UpdateProfileData): Promise<User> {
  return api.patch<User>(`/users/${userId}`, data)
}
