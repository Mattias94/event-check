import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { EnrollmentsRepository } from '../modules/enrollments/enrollments.repository'
import { EventsRepository } from '../modules/events/events.repository'
import { UsersRepository } from '../modules/users/users.repository'

@Module({
  providers: [PrismaService, UsersRepository, EventsRepository, EnrollmentsRepository],
  exports: [PrismaService, UsersRepository, EventsRepository, EnrollmentsRepository],
})
export class PersistenceModule {}
