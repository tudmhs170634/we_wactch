import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

async register (dto: RegisterDto){
    const existedUser = await this.prisma.user.findUnique({
        where:{
            email: dto.email,
        }
    })
    if(existedUser){
        throw new ConflictException('User already exists');
    }
    const password = await bcrypt.hash(dto.password,10);
    const user = await this.prisma.user.create({
        data:{
            email: dto.email,
            username: dto.username,
            password,
            role: UserRole.user,
            isHost: false,
        }

    })
    const { password: _, ...userWithoutPassword } = user;
    return {
        accessToken: this.jwt.sign({ sub: user.id, email: user.email }),
        user: userWithoutPassword,
    };
}

async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
    });
    if (!user) {
        throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;
    return {
        accessToken: this.jwt.sign({ sub: user.id, email: user.email }),
        user: userWithoutPassword,
    };
}
}

