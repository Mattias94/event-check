import { Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module'
import { EventsModule } from './modules/events/events.module'
import { UsersModule } from './modules/users/users.module'
import { EnrollmentsModule } from './modules/enrollments/enrollments.module'

@Module({
  imports: [UsersModule, EventsModule, EnrollmentsModule, AuthModule],
})
export class AppModule {}
