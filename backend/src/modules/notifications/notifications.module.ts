import { Module } from '@nestjs/common'
import { CheckInTokenService } from './check-in-token.service'
import { MailService } from './mail.service'

@Module({
  providers: [CheckInTokenService, MailService],
  exports: [CheckInTokenService, MailService],
})
export class NotificationsModule {}
