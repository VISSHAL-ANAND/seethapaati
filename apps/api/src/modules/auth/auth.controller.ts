import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  UsePipes,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  RegisterRequestSchema,
  RegisterRequest,
  LoginRequestSchema,
  LoginRequest,
  AuthUser,
} from '@seethapaati/contracts';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterRequestSchema))
  async register(
    @Body() dto: RegisterRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookie(res, result.accessToken, result.expiresIn);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginRequestSchema))
  async login(
    @Body() dto: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookie(res, result.accessToken, result.expiresIn);
    return {
      success: true,
      data: result,
    };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const fullUser = await this.authService.getCurrentUser(user.id);
    return {
      success: true,
      data: fullUser,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return {
      success: true,
      data: { message: 'Logged out successfully' },
    };
  }

  private setAuthCookie(res: Response, token: string, maxAgeSeconds: number) {
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAgeSeconds * 1000,
      path: '/',
    });
  }
}
