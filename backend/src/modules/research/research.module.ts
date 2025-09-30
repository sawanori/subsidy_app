import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { CsvService } from './services/csv.service';
import { NormalizeService } from './services/normalize.service';
import { MetricsService } from './services/metrics.service';
import { EStatConnector } from './connectors/estat.connector';
import { ResasConnector } from './connectors/resas.connector';
import { PrismaModule } from '../prisma/prisma.module';
import { ChartsModule } from '../charts/charts.module';
import { OpenAIProvider } from '../draft/llm/openai.provider';

@Module({
  imports: [PrismaModule, ChartsModule],
  controllers: [ResearchController],
  providers: [
    ResearchService,
    CsvService,
    NormalizeService,
    MetricsService,
    EStatConnector,
    ResasConnector,
    OpenAIProvider,
  ],
  exports: [ResearchService, EStatConnector, ResasConnector, NormalizeService, MetricsService],
})
export class ResearchModule {}