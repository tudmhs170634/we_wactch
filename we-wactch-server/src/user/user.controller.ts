import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserService } from './user.service';
import { BanUserDto } from './dto/ban-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @Roles('admin')
  getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.users.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      search,
    );
  }

  @Patch(':id/ban')
  @Roles('admin')
  banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
    return this.users.setBanned(id, dto.isBanned);
  }

  @Patch(':id/switch-role')
  @Roles('admin')
  switchRole(@Param('id') id: string) {
    return this.users.switchRole(id);
  }
}
