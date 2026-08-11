import { Module } from '@nestjs/common'
import { PersistenceModule } from '../../common/persistence.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [PersistenceModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
