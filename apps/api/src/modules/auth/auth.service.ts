import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HashingService } from './hashing.service';
import {
  RegisterRequest,
  LoginRequest,
  AuthUser,
  AuthResponse,
  RoleName,
  ROLE_DEFAULT_PERMISSIONS,
} from '@seethapaati/contracts';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
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

    const token = await this.jwtService.signAsync(authUser);

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

    const token = await this.jwtService.signAsync(authUser);

    return {
      user: authUser,
      accessToken: token,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles: RoleName[] = user.userRoles.map((ur) => ur.role.name as RoleName);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions: this.resolvePermissions(roles),
      isEmailVerified: user.isEmailVerified,
    };
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
