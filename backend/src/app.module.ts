import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
// import { PdfGeneratorModule } from './modules/pdf-generator/pdf-generator.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TimezoneMiddleware } from './common/middleware/timezone.middleware';
import { TimestampInterceptor } from './common/middleware/timestamp.interceptor';

@Module({
  imports: [
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
    // PdfGeneratorModule,
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TimezoneMiddleware)
      .forRoutes('*');
  }
}