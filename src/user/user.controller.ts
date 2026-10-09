import type { AuthUser } from './auth-user.js';
import { UserService } from './user.service.js';
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  async findAllUsers() {
    const users = await this.userService.findAllUsers();
    return {
      data: users,
      message: 'Fetched successfully',
    };
  }

  @Get('/profile')
  profile(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
