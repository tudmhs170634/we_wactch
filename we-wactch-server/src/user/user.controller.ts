import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
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
  getAllUsers() {
    return this.users.findAll();
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
