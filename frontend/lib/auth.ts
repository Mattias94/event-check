export interface User {
  id: string
  name: string
  email: string
  password: string
  dob?: string
}

const USERS_STORAGE_KEY = 'event_check_users'
const PASSWORD_RESET_KEY = 'event_check_resets'

export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return []
  const users = localStorage.getItem(USERS_STORAGE_KEY)
  return users ? JSON.parse(users) : []
}

export function getUserByEmail(email: string): User | null {
  const users = getAllUsers()
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

export function createUser(userData: Omit<User, 'id'>): User {
  const users = getAllUsers()
  const newUser: User = {
    ...userData,
    id: Date.now().toString()
  }
  users.push(newUser)
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  return newUser
}

export function verifyCredentials(email: string, password: string): User | null {
  const user = getUserByEmail(email)
  if (user && user.password === password) {
    return user
  }
  return null
}

export function initiatePasswordReset(email: string): boolean {
  const user = getUserByEmail(email)
  if (!user) return false

  const resets = JSON.parse(localStorage.getItem(PASSWORD_RESET_KEY) || '[]')
  const resetLink = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  resets.push({
    email,
    resetLink,
    createdAt: new Date().toISOString(),
    used: false
  })

  localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(resets))

  // Simular envio de email
  console.log(`📧 Email de recuperação enviado para ${email}`)
  console.log(`🔗 Link: http://localhost:3002/reset-password?token=${resetLink}`)

  return true
}

export function resetPassword(token: string, newPassword: string): boolean {
  const resets = JSON.parse(localStorage.getItem(PASSWORD_RESET_KEY) || '[]')
  const reset = resets.find((r: any) => r.resetLink === token && !r.used)

  if (!reset) return false

  const users = getAllUsers()
  const userIndex = users.findIndex(u => u.email.toLowerCase() === reset.email.toLowerCase())

  if (userIndex === -1) return false

  users[userIndex].password = newPassword
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))

  reset.used = true
  localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(resets))

  return true
}
