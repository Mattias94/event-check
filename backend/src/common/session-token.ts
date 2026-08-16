import * as jwt from 'jsonwebtoken'
import { UserRole } from './domain.types'

export interface SessionTokenPayload {
  sub: string
  role: UserRole
}

const DEFAULT_SECRET = 'event-check-dev-auth-secret'
const secret = process.env.AUTH_TOKEN_SECRET ?? DEFAULT_SECRET

export function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret)
    if (typeof decoded === 'string' || !decoded.sub) {
      return null
    }
    return { sub: decoded.sub as string, role: (decoded as jwt.JwtPayload).role as UserRole }
  } catch {
    return null
  }
}
