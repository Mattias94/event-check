import { Module } from '@nestjs/common'
import { PersistenceModule } from '../../common/persistence.module'
import { EnrollmentsController } from './enrollments.controller'
import { EnrollmentsService } from './enrollments.service'

@Module({
  imports: [PersistenceModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
