import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { PrismaService } from '@prisma/prisma.service';
import { ErrorCode } from '@/common/exceptions/app-error.codes';

/**
 * 背景生成サービス
 * APP-332: 背景生成 /generate/background（引用必須・脚注付き）
 */
@Injectable()
export class BackgroundGeneratorService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  /**
   * 背景生成
   */
  async generate(
    applicationId: string,
    evidenceIds: string[],
  ): Promise<BackgroundGenerationResult> {
    try {
      // 1. 申請情報とエビデンスを取得
      const application = await this.getApplicationData(applicationId);
      const evidences = await this.getEvidences(evidenceIds);

      // 2. プロンプト構築
      const prompt = this.buildPrompt(application, evidences);

      // 3. OpenAI API呼び出し
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';

      // 4. 引用抽出と脚注作成
      const citations = this.extractCitations(content, evidences);

      // 5. 結果保存
      await this.saveResult(applicationId, content, citations);

      return {
        content,
        citations,
        metadata: {
          model: 'gpt-4-turbo-preview',
          tokensUsed: response.usage?.total_tokens || 0,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Background generation failed: ${error.message}`);
    }
  }

  /**
   * システムプロンプト
   */
  private getSystemPrompt(): string {
    return `あなたは補助金申請書の作成を支援する専門家です。
以下の点に注意して、事業背景と課題を説明する文章を作成してください：

1. 具体的な数値やデータを含める
2. 提供されたエビデンスから必ず引用する
3. 引用箇所には[1], [2]のような脚注番号を付ける
4. 論理的で説得力のある構成にする
5. 審査員に向けたビジネス文書のトーンを保つ

出力形式:
【現状】
（現在の事業状況を記載）

【課題】
・課題1
・課題2
・課題3

【市場環境】
（業界動向や市場規模を記載）

【競争優位性】
（自社の強みを記載）

【必要性】
（補助金が必要な理由を記載）`;
  }

  /**
   * プロンプト構築
   */
  private buildPrompt(application: any, evidences: any[]): string {
    let prompt = `事業者情報:
`;

    if (application.applicant) {
      prompt += `- 事業者名: ${application.applicant.name || application.applicant.companyName}
`;
      prompt += `- 業種: ${application.applicant.industry || '未設定'}
`;
      prompt += `- 従業員数: ${application.applicant.employeeCount || '未設定'}
`;
    }

    prompt += `
エビデンス:
`;

    evidences.forEach((evidence, index) => {
      prompt += `[${index + 1}] ${evidence.title}
`;
      prompt += `URL: ${evidence.url}
`;
      prompt += `内容: ${evidence.content.substring(0, 500)}...

`;
    });

    prompt += `
上記の情報を基に、補助金申請のための事業背景・課題を作成してください。
エビデンスからの引用を必ず含め、脚注番号を付けてください。`;

    return prompt;
  }

  /**
   * 引用抽出
   */
  private extractCitations(content: string, evidences: any[]): Citation[] {
    const citations: Citation[] = [];
    const citationPattern = /\[(\d+)\]/g;
    const matches = content.matchAll(citationPattern);

    for (const match of matches) {
      const citationNumber = parseInt(match[1]);
      const evidenceIndex = citationNumber - 1;

      if (evidences[evidenceIndex]) {
        const evidence = evidences[evidenceIndex];
        
        // 引用箇所のテキストを抽出（引用番号の前後50文字）
        const startPos = Math.max(0, match.index! - 50);
        const endPos = Math.min(content.length, match.index! + 50);
        const citedText = content.substring(startPos, endPos);

        citations.push({
          evidenceId: evidence.id,
          citationNumber,
          citedText: citedText.replace(/\[(\d+)\]/g, ''),
          url: evidence.url,
          title: evidence.title,
        });
      }
    }

    return citations;
  }

  /**
   * 申請情報取得
   */
  private async getApplicationData(applicationId: string): Promise<any> {
    // Prismaを使用して申請情報を取得
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        evidences: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  }

  /**
   * エビデンス取得
   */
  private async getEvidences(evidenceIds: string[]): Promise<any[]> {
    if (!evidenceIds || evidenceIds.length === 0) {
      return [];
    }

    const evidences = await this.prisma.evidence.findMany({
      where: {
        id: { in: evidenceIds },
      },
    });

    return evidences;
  }

  /**
   * 結果保存
   */
  private async saveResult(
    applicationId: string,
    content: string,
    citations: Citation[],
  ): Promise<void> {
    // 生成結果をDBに保存
    await this.prisma.generationResult.create({
      data: {
        application: { connect: { id: applicationId } },
        type: 'BACKGROUND',
        content,
        model: 'gpt-4-turbo-preview',
        tokensUsed: 0,
        cost: 0,
        citations: {
          create: citations.map((citation) => ({
            evidenceId: citation.evidenceId,
            citationNumber: citation.citationNumber,
            citedText: citation.citedText,
            url: citation.url,
            title: citation.title,
          })),
        },
        metadata: {
          generatedAt: new Date(),
          model: 'gpt-4-turbo-preview',
        },
      },
    });
  }
}

// 型定義
export interface BackgroundGenerationResult {
  content: string;
  citations: Citation[];
  metadata: GenerationMetadata;
}

export interface Citation {
  evidenceId: string;
  citationNumber: number;
  citedText: string;
  url: string;
  title: string;
}

export interface GenerationMetadata {
  model: string;
  tokensUsed: number;
  generatedAt: string;
  processingTime?: number;
}
