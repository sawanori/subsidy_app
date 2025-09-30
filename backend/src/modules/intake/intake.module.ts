import { Module } from '@nestjs/common';
import { IntakeController } from './intake.controller';
import { FileValidatorService } from './services/file-validator.service';
import { PdfExtractorService } from './services/pdf-extractor.service';
import { OcrProviderService } from './services/ocr-provider.service';
import { DocumentExtractorService } from './services/document-extractor.service';
import { PrismaModule } from '@prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [IntakeController],
  providers: [
    FileValidatorService,
    PdfExtractorService,
    OcrProviderService,
    DocumentExtractorService,
  ],
  exports: [
    FileValidatorService,
    PdfExtractorService,
    OcrProviderService,
    DocumentExtractorService,
  ],
})
export class IntakeModule {}