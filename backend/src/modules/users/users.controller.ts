import { Controller, Get, Param, Post, Query, Body, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../../common/guards/admin.guard'
import { CreateUserDto } from './dtos/create-user.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AdminGuard)
  listUsers() {
    return this.usersService.listUsers()
  }

  @Get('search')
  @UseGuards(AdminGuard)
  searchUsers(@Query('q') q = '') {
    return this.usersService.searchUsers(q)
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id)
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.usersService.getEnrollmentStats(id)
  }

  @Post()
  @UseGuards(AdminGuard)
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto)
  }
}
