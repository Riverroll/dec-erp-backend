import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginRequestDto } from './dto/requests/login-request.dto';
import { ForgotPasswordRequestDto } from './dto/requests/forgot-password-request.dto';
import { ResetPasswordRequestDto } from './dto/requests/reset-password-request.dto';
import { LoginResponseDto } from './dto/responses/auth-response.dto';
import { AUTH_MESSAGES } from './auth.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    // Find user by username or email
    const user = await this.prisma.user.findFirst({
      where: {
        flag: 1,
        OR: [{ username: dto.identifier }, { email: dto.identifier }],
      },
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException(AUTH_MESSAGES.ACCOUNT_BLOCKED);
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException(AUTH_MESSAGES.ACCOUNT_INACTIVE);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const roles = user.user_roles.map((ur) => ur.role.name);
    const expiresIn = dto.rememberMe
      ? this.config.get('JWT_LONG_EXPIRES_IN', '7d')
      : this.config.get('JWT_EXPIRES_IN', '15m');

    const payload = {
      userId: user.id,
      username: user.username,
      roles,
    };

    const token = this.jwtService.sign(payload, { expiresIn });
    const decoded = this.jwtService.decode(token) as any;

    return {
      token,
      expires_at: new Date(decoded.exp * 1000).toISOString(),
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        roles,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        flag: 1,
        OR: [{ email: dto.identifier }, { username: dto.identifier }],
      },
    });

    // Always return success to prevent email enumeration
    if (!user) return;

    // TODO: Generate reset token, store in Redis, send email
    // For now, just log (implement mailer in Sprint 6)
    console.log(`Password reset requested for user: ${user.email}`);
  }

  async resetPassword(token: string, dto: ResetPasswordRequestDto): Promise<void> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException(AUTH_MESSAGES.PASSWORD_MISMATCH);
    }

    // TODO: Validate token from Redis, find user, update password
    // Placeholder implementation
    throw new NotFoundException(AUTH_MESSAGES.RESET_TOKEN_INVALID);
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, flag: 1 },
      include: {
        user_roles: { include: { role: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const { password: _, ...safeUser } = user;
    return {
      ...safeUser,
      roles: user.user_roles.map((ur) => ur.role.name),
    };
  }
}
