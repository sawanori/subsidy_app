import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    // Skip database connection in development mode if database is not available
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      this.logger.warn('⚠️  Database connection skipped (SKIP_DB_CONNECTION=true)');
      return;
    }

    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Database connection failed. Set SKIP_DB_CONNECTION=true to continue without database.');
      this.logger.error(error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}