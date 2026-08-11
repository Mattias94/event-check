import { Module } from '@nestjs/common'
import { InMemoryStore } from './in-memory-store'
import { EnrollmentsRepository } from '../modules/enrollments/enrollments.repository'
import { EventsRepository } from '../modules/events/events.repository'
import { UsersRepository } from '../modules/users/users.repository'

@Module({
  providers: [InMemoryStore, UsersRepository, EventsRepository, EnrollmentsRepository],
  exports: [InMemoryStore, UsersRepository, EventsRepository, EnrollmentsRepository],
})
export class PersistenceModule {}
