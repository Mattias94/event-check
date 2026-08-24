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
    const role = (decoded as jwt.JwtPayload).role
    if (role !== 'admin' && role !== 'user') {
      return null
    }
    return { sub: decoded.sub as string, role: role as UserRole }
  } catch {
    return null
  }
}

interface TokenCarrier {
  headers: Record<string, string | undefined>
  cookies?: Record<string, string>
}

/** Lê o JWT de sessão do header Authorization ou do cookie httpOnly. */
export function extractSessionToken(request: TokenCarrier): string | null {
  const header = request.headers.authorization
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length)
  }

  return request.cookies?.auth_token ?? null
}
