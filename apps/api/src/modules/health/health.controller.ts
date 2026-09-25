import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Public()
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'seethapaati-commerce-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Public()
  @Get('live')
  getLiveness() {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async getReadiness(@Res() res: Response) {
    let dbStatus = 'unhealthy';
    let redisStatus = 'degraded_or_unreachable';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'healthy';
    } catch {
      dbStatus = 'unreachable';
    }

    if (this.redis.isReady()) {
      redisStatus = 'healthy';
    }

    const isReady = dbStatus === 'healthy';

    return res.status(isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: isReady ? 'ready' : 'not_ready',
      dependencies: {
        database: dbStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
