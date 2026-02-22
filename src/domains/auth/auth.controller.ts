import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/requests/login-request.dto';
import { ForgotPasswordRequestDto } from './dto/requests/forgot-password-request.dto';
import { ResetPasswordRequestDto } from './dto/requests/reset-password-request.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AUTH_MESSAGES } from './auth.constant';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username/email and password' })
  async login(@Body() dto: LoginRequestDto) {
    const data = await this.authService.login(dto);
    return { message: AUTH_MESSAGES.LOGIN_SUCCESS, data };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    await this.authService.forgotPassword(dto);
    return { message: AUTH_MESSAGES.FORGOT_PASSWORD_SENT, data: null };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(
    @Query('token') token: string,
    @Body() dto: ResetPasswordRequestDto,
  ) {
    await this.authService.resetPassword(token, dto);
    return { message: AUTH_MESSAGES.RESET_PASSWORD_SUCCESS, data: null };
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    const data = await this.authService.getProfile(user.userId);
    return { message: 'Profile fetched successfully', data };
  }
}
