import { Module } from '@nestjs/common';
import { PdfGeneratorController } from './pdf-generator.controller';
import { ExtendedPdfService } from './services/extended-pdf.service';
import { ExtendedApplicationModule } from '../extended-application/extended-application.module';
import { ApplicationsModule } from '@applications/applications.module';
import { PrismaModule } from '@prisma/prisma.module';
import { ChartsModule } from '@/modules/charts/charts.module';

@Module({
  imports: [
    PrismaModule,
    ChartsModule,
    ExtendedApplicationModule,
    ApplicationsModule,
  ],
  controllers: [PdfGeneratorController],
  providers: [ExtendedPdfService],
  exports: [ExtendedPdfService],
})
export class PdfGeneratorModule {}
