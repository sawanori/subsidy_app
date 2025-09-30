import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { I18nModule } from './common/i18n/i18n.module';
import { ApplicationsModule } from './applications/applications.module';
import { PlansModule } from './plans/plans.module';
import { TemplateModule } from './template/template.module';
import { EvidenceModule } from './evidence/evidence.module';
import { ExtendedApplicationModule } from './modules/extended-application/extended-application.module';
import { AIAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { PdfGeneratorModule } from './modules/pdf-generator/pdf-generator.module';
import { SupabaseModule } from './supabase/supabase.module';
import { IntakeModule } from './modules/intake/intake.module';
import { HealthModule } from './modules/health/health.module';
import { AutoPlanModule } from './modules/auto-plan/auto-plan.module';
import { DraftModule } from './modules/draft/draft.module';
import { ChartsModule } from './modules/charts/charts.module';
import { ValidateModule } from './modules/validate/validate.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ResearchModule } from './modules/research/research.module';
import { TimezoneMiddleware } from './common/middleware/timezone.middleware';
import { TimestampInterceptor } from './common/middleware/timestamp.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    SupabaseModule,
    AuditModule,
    I18nModule,
    ApplicationsModule,
    PlansModule,
    TemplateModule,
    EvidenceModule,
    ExtendedApplicationModule,
    AIAssistantModule,
    IntakeModule,
    HealthModule,
    AutoPlanModule,
    DraftModule,
    ChartsModule,
    ValidateModule,
    ProjectsModule,
    ResearchModule,
    PdfGeneratorModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      signOptions: { expiresIn: '1d' },
    }),
    ThrottlerModule.forRoot([{
      ttl: 300000, // 5 minutes
      limit: 100, // 100 requests per 5 minutes
    }])
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TimestampInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TimezoneMiddleware)
      .forRoutes('*');
  }
}
