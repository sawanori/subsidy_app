import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DraftController } from './draft.controller';
import { DraftService } from './draft.service';
import { OpenAIProvider } from './llm/openai.provider';
import { MockOpenAIProvider } from './llm/mock-openai.provider';
import { PromptBuilderService } from './prompts/prompt-builder.service';
import { PrismaModule } from '@prisma/prisma.module';
import { LLMProvider } from './llm/llm.provider.interface';

/**
 * DraftModule - 草案生成・管理モジュール
 *
 * RAGベースの草案生成と版管理機能を提供
 * - DraftService: 草案生成・管理ロジック
 * - OpenAIProvider/MockOpenAIProvider: LLM統合（環境変数で切替）
 * - PromptBuilderService: プロンプト最適化（Few-shot learning）
 * - PrismaModule: DB接続（SchemeTemplate, Project, Draft）
 *
 * 環境変数:
 * - USE_MOCK_LLM=true: モックプロバイダー使用（開発用）
 * - OPENAI_API_KEY: OpenAI APIキー（本番用）
 */
@Module({
  imports: [PrismaModule],
  controllers: [DraftController],
  providers: [
    DraftService,
    PromptBuilderService,
    {
      provide: OpenAIProvider,
      useFactory: (configService: ConfigService) => {
        const useMock = configService.get<string>('USE_MOCK_LLM') === 'true';
        const apiKey = configService.get<string>('OPENAI_API_KEY');

        if (useMock || !apiKey) {
          return new MockOpenAIProvider();
        }
        return new OpenAIProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [DraftService],
})
export class DraftModule {}

