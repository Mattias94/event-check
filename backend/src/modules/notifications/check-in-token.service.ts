import { Injectable } from '@nestjs/common'
import * as jwt from 'jsonwebtoken'

export interface CheckInTokenPayload {
  enrollmentId: string
  userId: string
  eventId: string
  checkInToken: string
}

const DEFAULT_SECRET = 'event-check-dev-secret'

function isValidPayload(decoded: jwt.JwtPayload): decoded is jwt.JwtPayload & CheckInTokenPayload {
  return (
    typeof decoded.enrollmentId === 'string' &&
    typeof decoded.userId === 'string' &&
    typeof decoded.eventId === 'string' &&
    typeof decoded.checkInToken === 'string' &&
    decoded.enrollmentId.length > 0 &&
    decoded.userId.length > 0 &&
    decoded.eventId.length > 0 &&
    decoded.checkInToken.length > 0
  )
}

@Injectable()
export class CheckInTokenService {
  private readonly secret = process.env.QR_TOKEN_SECRET ?? DEFAULT_SECRET

  sign(payload: CheckInTokenPayload): string {
    return jwt.sign(payload, this.secret)
  }

  verify(token: string): CheckInTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret)
      if (typeof decoded === 'string') {
        return null
      }

      const payload = decoded as jwt.JwtPayload
      if (!isValidPayload(payload)) {
        return null
      }

      return {
        enrollmentId: payload.enrollmentId,
        userId: payload.userId,
        eventId: payload.eventId,
        checkInToken: payload.checkInToken,
      }
    } catch {
      return null
    }
  }
}
