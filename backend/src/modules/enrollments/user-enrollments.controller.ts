import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { SelfOrAdminGuard } from '../../common/guards/self-or-admin.guard'
import { EnrollmentsService } from './enrollments.service'

/**
 * Rotas de inscrições sob a ótica do usuário ("Minhas Inscrições").
 */
@Controller('users/:userId/enrollments')
export class UserEnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @UseGuards(SelfOrAdminGuard)
  listByUser(@Param('userId') userId: string) {
    return this.enrollmentsService.listByUserWithDetails(userId)
  }
}
