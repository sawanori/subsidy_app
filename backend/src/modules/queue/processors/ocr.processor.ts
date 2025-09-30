import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('ocr')
@Injectable()
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);

  @Process()
  async process(job: Job<any>) {
    this.logger.log(`Processing OCR job ${job.id}`);
    // Stub implementation - add actual OCR processing logic here
    return {
      text: '',
      confidence: 0,
      success: true
    };
  }
}