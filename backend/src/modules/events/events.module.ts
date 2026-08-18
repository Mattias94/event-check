import { Module } from '@nestjs/common'
import { PersistenceModule } from '../../common/persistence.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'

@Module({
  imports: [PersistenceModule, NotificationsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
