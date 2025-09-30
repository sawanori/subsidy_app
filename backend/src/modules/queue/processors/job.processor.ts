import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('job')
@Injectable()
export class JobProcessor {
  private readonly logger = new Logger(JobProcessor.name);

  @Process()
  async process(job: Job<any>) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    // Stub implementation - add actual job processing logic here
    return { success: true };
  }
}