import { Module } from '@nestjs/common';
import { AutoPlanController } from './auto-plan.controller';
import { BaselineBuilderService } from './services/baseline-builder.service';
import { IntentStructurerService } from './services/intent-structurer.service';
import { KPIGeneratorService } from './services/kpi-generator.service';
import { KPIValidatorService } from './services/kpi-validator.service';
import { PlanGeneratorService } from './services/plan-generator.service';
import { TextPreflightService } from './services/text-preflight.service';
import { AuditService } from './services/audit.service';
import { AIAssistantModule } from '../ai-assistant/ai-assistant.module';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  imports: [AIAssistantModule, PrismaModule],
  controllers: [AutoPlanController],
  providers: [
    BaselineBuilderService,
    IntentStructurerService,
    KPIGeneratorService,
    KPIValidatorService,
    PlanGeneratorService,
    TextPreflightService,
    AuditService,
  ],
})
export class AutoPlanModule {}

