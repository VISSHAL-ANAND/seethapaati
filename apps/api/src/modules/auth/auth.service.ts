import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HashingService } from './hashing.service';
import {
  RegisterRequest,
  LoginRequest,
  AuthUser,
  AuthResponse,
  JwtPayload,
  RoleName,
  ROLE_DEFAULT_PERMISSIONS,
} from '@seethapaati/contracts';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authCacheTtlSeconds = 120; // 2 minutes cache window to prevent stale permissions

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private hashing: HashingService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterRequest): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException({
        error: 'USER_ALREADY_EXISTS',
        message: 'An account with this email address already exists',
      });
    }

    const passwordHash = await this.hashing.hash(dto.password);

    // Find or create default CUSTOMER role
    let customerRole = await this.prisma.role.findUnique({
      where: { name: RoleName.CUSTOMER },
    });

    if (!customerRole) {
      customerRole = await this.prisma.role.create({
        data: {
          name: RoleName.CUSTOMER,
          description: 'Standard store customer',
        },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        userRoles: {
          create: {
            roleId: customerRole.id,
          },
        },
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    const roles: RoleName[] = user.userRoles.map((ur) => ur.role.name as RoleName);
    const permissions = this.resolvePermissions(roles);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions,
      isEmailVerified: user.isEmailVerified,
    };

    // Storing ONLY sub and email in the JWT - no permissions or roles embedded
    // to prevent privilege escalation or 7-day stale permission windows
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const token = await this.jwtService.signAsync(jwtPayload);

    // Cache the initial user auth state
    await this.cacheAuthUser(authUser);

    this.logger.log(`New user registered: ${user.email} [${user.id}]`);

    return {
      user: authUser,
      accessToken: token,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  async login(dto: LoginRequest): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isValid = await this.hashing.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const roles: RoleName[] = user.userRoles.map((ur) => ur.role.name as RoleName);
    const permissions = this.resolvePermissions(roles);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions,
      isEmailVerified: user.isEmailVerified,
    };

    // Storing ONLY sub and email in the JWT payload
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const token = await this.jwtService.signAsync(jwtPayload);

    // Cache the auth state
    await this.cacheAuthUser(authUser);

    return {
      user: authUser,
      accessToken: token,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }

  /**
   * Resolves current user authentication and authorization details.
   * Employs short-lived Redis caching (120s) with fast database fallback.
   * Ensures role/permission changes take effect without waiting for JWT expiry.
   */
  async getAuthUser(userId: string): Promise<AuthUser> {
    const cacheKey = `auth:user:${userId}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as AuthUser;
      }
    } catch {
      // Redis error or cache miss, proceed to DB
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        error: 'USER_NOT_FOUND',
        message: 'User account no longer exists or session is invalid',
      });
    }

    const roles: RoleName[] = user.userRoles.map((ur) => ur.role.name as RoleName);
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions: this.resolvePermissions(roles),
      isEmailVerified: user.isEmailVerified,
    };

    await this.cacheAuthUser(authUser);
    return authUser;
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    return this.getAuthUser(userId);
  }

  async invalidateUserAuthCache(userId: string): Promise<void> {
    try {
      await this.redis.del(`auth:user:${userId}`);
    } catch (err) {
      this.logger.warn(`Failed to invalidate auth cache for user ${userId}: ${(err as Error).message}`);
    }
  }

  private async cacheAuthUser(authUser: AuthUser): Promise<void> {
    try {
      await this.redis.set(
        `auth:user:${authUser.id}`,
        JSON.stringify(authUser),
        this.authCacheTtlSeconds,
      );
    } catch (err) {
      this.logger.warn(`Failed to cache auth user ${authUser.id}: ${(err as Error).message}`);
    }
  }

  private resolvePermissions(roles: RoleName[]): string[] {
    const permSet = new Set<string>();
    for (const role of roles) {
      const perms = ROLE_DEFAULT_PERMISSIONS[role] || [];
      for (const p of perms) {
        permSet.add(p);
      }
    }
    return Array.from(permSet);
  }
}
