import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../modules/auth/auth.service';
import { JwtPayload } from '@seethapaati/contracts';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request) || request.cookies?.['access_token'];

    if (isPublic) {
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
            secret: this.configService.get<string>('JWT_SECRET'),
          });
          if (payload?.sub) {
            const authUser = await this.authService.getAuthUser(payload.sub);
            request['user'] = authUser;
          }
        } catch {
          // Permissive auth for public routes: gracefully fall back to anonymous
          request['user'] = undefined;
        }
      } else {
        request['user'] = undefined;
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Authentication credentials were not provided',
      });
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({
        error: 'INVALID_TOKEN',
        message: 'Session has expired or is invalid',
      });
    }

    if (!payload?.sub) {
      throw new UnauthorizedException({
        error: 'INVALID_TOKEN',
        message: 'Token payload missing user identifier',
      });
    }

    // Dynamic resolution of active user roles and permissions
    // Eliminates the risk of stale permissions on long-lived sessions
    try {
      const authUser = await this.authService.getAuthUser(payload.sub);
      request['user'] = authUser;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Failed to resolve user session',
      });
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
