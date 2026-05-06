import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
    imports: [
        PrismaModule,
        UploadModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET ?? 'change-me',
            signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN as any) ?? '7d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
