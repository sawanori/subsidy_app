import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { JobProcessor } from './processors/job.processor';
import { OcrProcessor } from './processors/ocr.processor';
import { ExportProcessor } from './processors/export.processor';
import { RegressionProcessor } from './processors/regression.processor';

/**
 * キューモジュール
 * APP-365: BullMQ導入（OCR/回帰/ZIP生成のジョブ化）
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: 'ocr',
        defaultJobOptions: {
          attempts: 3,
          timeout: 60000, // 1分
        },
      },
      {
        name: 'export',
        defaultJobOptions: {
          attempts: 2,
          timeout: 300000, // 5分
        },
      },
      {
        name: 'regression',
        defaultJobOptions: {
          attempts: 1,
          timeout: 120000, // 2分
        },
      },
      {
        name: 'general',
        defaultJobOptions: {
          attempts: 3,
          timeout: 30000, // 30秒
        },
      },
    ),
  ],
  providers: [
    QueueService,
    JobProcessor,
    OcrProcessor,
    ExportProcessor,
    RegressionProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule {}