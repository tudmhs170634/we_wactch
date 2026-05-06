import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly uploadService: UploadService,
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
            avatarUrl: dto.avatarUrl,
            role: UserRole.user,
            isHost: false,
        }

    })

    // Confirm image on Cloudinary if it was pre-uploaded
    if (dto.avatarPublicId) {
        try {
            await this.uploadService.makePermanent(dto.avatarPublicId);
        } catch (error) {
            console.error('Failed to confirm Cloudinary image:', error);
            // We don't throw error here to not block registration if only tag update fails
        }
    }
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

async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Nếu có đổi username, kiểm tra xem có trùng với ai khác không
    if (dto.username) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                username: dto.username,
                NOT: { id: userId }
            }
        });
        
        if (existingUser) {
            throw new ConflictException('Tên người dùng đã tồn tại');
        }
    }

    const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
            username: dto.username,
            avatarUrl: dto.avatarUrl,
        },
    });

    if (dto.avatarPublicId) {
        try {
            await this.uploadService.makePermanent(dto.avatarPublicId);
        } catch (error) {
            console.error('Failed to confirm Cloudinary image:', error);
        }
    }

    const { password: _, ...userWithoutPassword } = user;
    
    // Tạo token mới với thông tin đã cập nhật
    const newToken = this.jwt.sign({ 
        sub: user.id, 
        email: user.email 
    });

    return {
        user: userWithoutPassword,
        accessToken: newToken
    };
}
}

