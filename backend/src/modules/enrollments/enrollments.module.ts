import { Module } from '@nestjs/common'
import { PersistenceModule } from '../../common/persistence.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { EnrollmentsController } from './enrollments.controller'
import { UserEnrollmentsController } from './user-enrollments.controller'
import { EnrollmentsService } from './enrollments.service'

@Module({
  imports: [PersistenceModule, NotificationsModule],
  controllers: [EnrollmentsController, UserEnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
