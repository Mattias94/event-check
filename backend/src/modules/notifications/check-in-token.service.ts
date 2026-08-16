import { Injectable } from '@nestjs/common'
import * as jwt from 'jsonwebtoken'

export interface CheckInTokenPayload {
  enrollmentId: string
  userId: string
  eventId: string
  checkInToken: string
}

const DEFAULT_SECRET = 'event-check-dev-secret'

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
      return decoded as unknown as CheckInTokenPayload
    } catch {
      return null
    }
  }
}
