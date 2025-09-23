import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { OCRService } from './services/ocr.service';
import { FileProcessorService } from './services/file-processor.service';
import { SecurityService } from './services/security.service';
import { DataTransformationService } from './services/data-transformation.service';
import { ProcessingQueueService } from './services/processing-queue.service';
import { StorageOptimizationService } from './services/storage-optimization.service';
import { I18nModule } from '../common/i18n/i18n.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, I18nModule],
  controllers: [EvidenceController],
  providers: [
    EvidenceService,
    OCRService,
    FileProcessorService,
    SecurityService,
    DataTransformationService,
    ProcessingQueueService,
    StorageOptimizationService,
  ],
  exports: [
    EvidenceService, 
    OCRService, 
    FileProcessorService, 
    SecurityService, 
    DataTransformationService,
    ProcessingQueueService,
    StorageOptimizationService
  ],
})
export class EvidenceModule {}