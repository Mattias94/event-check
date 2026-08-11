import { Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { EnrollmentsService } from './enrollments.service'

@Controller('events/:eventId/enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  listByEvent(@Param('eventId') eventId: string) {
    return this.enrollmentsService.listByEvent(eventId)
  }

  @Get(':userId')
  isEnrolled(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
  ) {
    return { enrolled: this.enrollmentsService.isEnrolled(userId, eventId) }
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
