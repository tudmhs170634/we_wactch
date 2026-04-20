import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * TODO (Dev A): implement findAll
   * Return paginated list of users
   */
  async findAll() {
    // return this.prisma.user.findMany();
    return [];
  }

  /**
   * TODO (Dev A): implement findById
   */
  async findById(_id: string) {
    // return this.prisma.user.findUniqueOrThrow({ where: { id } });
    return null;
  }

  /**
   * TODO (Dev A): implement findByEmail — used by AuthService
   */
  async findByEmail(_email: string) {
    // return this.prisma.user.findUnique({ where: { email } });
    return null;
  }

  /**
   * TODO (Dev A): implement update
   */
  async update(_id: string, _dto: UpdateUserDto) {
    return null;
  }

  /**
   * TODO (Dev A): implement remove
   */
  async remove(_id: string) {
    return null;
  }
}
