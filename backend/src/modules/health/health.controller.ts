import { Controller, Get } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      // データベース接続チェック
      () => this.prismaHealth.pingCheck('database', this.prisma),
      // 外部API接続チェック（必要に応じて）
      // () => this.http.pingCheck('external-api', 'https://api.example.com/health'),
    ]);
  }

  @Get('simple')
  @Public()
  simpleCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @Get('detailed')
  @Public()
  async detailedCheck() {
    const dbStatus = await this.checkDatabase();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      status: dbStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: dbStatus ? 'up' : 'down',
        },
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        },
        uptime: `${Math.floor(uptime)} seconds`,
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}