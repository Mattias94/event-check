import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../../common/guards/admin.guard'
import { CheckInDto } from './dtos/check-in.dto'
import { EnrollmentsService } from './enrollments.service'

@Controller('events/:eventId/enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @UseGuards(AdminGuard)
  listByEvent(@Param('eventId') eventId: string) {
    return this.enrollmentsService.listByEvent(eventId)
  }

  @Post('check-in')
  @UseGuards(AdminGuard)
  checkIn(
    @Param('eventId') eventId: string,
    @Body() body: CheckInDto,
  ) {
    return this.enrollmentsService.checkIn(eventId, body.token)
  }

  @Get(':userId')
  async isEnrolled(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
  ) {
    return { enrolled: await this.enrollmentsService.isEnrolled(userId, eventId) }
  }

  @Post(':userId')
  enroll(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
  ) {
    return this.enrollmentsService.enroll(userId, eventId)
  }

  @Delete(':userId')
  unenroll(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
  ) {
    return this.enrollmentsService.unenroll(userId, eventId)
  }
}
