import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIAssistantController } from './ai-assistant.controller';
import { AIAssistantService } from './services/ai-assistant.service';

@Module({
  imports: [ConfigModule],
  controllers: [AIAssistantController],
  providers: [AIAssistantService],
  exports: [AIAssistantService],
})
export class AIAssistantModule {}