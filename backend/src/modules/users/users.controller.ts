import { Controller, Get, Param, Post, Query, Body } from '@nestjs/common'
import { CreateUserDto } from './dtos/create-user.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers() {
    return this.usersService.listUsers()
  }

  @Get('search')
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
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto)
  }
}
