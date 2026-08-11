import { Injectable } from '@nestjs/common'
import { createSeedState } from './seed-data'

@Injectable()
export class InMemoryStore {
  users = [...createSeedState().users]
  events = [...createSeedState().events]
  enrollments = [...createSeedState().enrollments]
  passwordResets = [...createSeedState().passwordResets]
}
