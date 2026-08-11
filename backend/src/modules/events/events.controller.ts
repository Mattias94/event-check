import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { EventFilters } from '../../common/domain.types'
import { CreateEventDto } from './dtos/create-event.dto'
import { UpdateEventDto } from './dtos/update-event.dto'
import { EventsService } from './events.service'

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: EventFilters = { search, category, startDate, endDate }
    return this.eventsService.list(filters)
  }

  @Get('categories')
  categories() {
    return this.eventsService.categories()
  }

  @Get('admin/:adminId')
  listByAdmin(@Param('adminId') adminId: string) {
    return this.eventsService.listByAdmin(adminId)
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.eventsService.getById(id)
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto)
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.eventsService.delete(id)
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.eventsService.cancel(id)
  }
}
