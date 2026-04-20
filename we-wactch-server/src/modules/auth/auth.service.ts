import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * TODO (Dev A): implement registration
   * - Hash password with bcrypt (saltRounds from config)
   * - Save user via UsersService
   * - Return access token
   */
  async register(_dto: RegisterDto): Promise<{ accessToken: string }> {
    throw new Error('Not implemented yet');
  }

  /**
   * TODO (Dev A): implement login
   * - Find user by email via UsersService
   * - Verify password with bcrypt.compare
   * - Return access token
   */
  async login(_dto: LoginDto): Promise<{ accessToken: string }> {
    throw new Error('Not implemented yet');
  }

  /** Sign a JWT payload — ready to use */
  signToken(payload: JwtPayload): string {
    const secret = this.configService.get<string>('jwt.secret');
    const expiresIn = this.configService.get<string>('jwt.expiresIn') ?? '7d';
    return this.jwtService.sign(payload as object, {
      secret,
      expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
    });
  }

  /** Utility: hash a plain-text password */
  async hashPassword(plain: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(plain, saltRounds);
  }

  /** Utility: compare plain vs hashed password */
  async comparePasswords(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
