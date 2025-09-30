import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  LLMProvider,
  LLMOptions,
  LLMResponse,
} from './llm.provider.interface';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private client: OpenAI;
  private readonly defaultModel = 'gpt-4o-mini';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === '') {
      this.logger.warn('⚠️  OPENAI_API_KEY is not set. OpenAI calls will fail.');
      this.logger.warn('💡 Consider using MockOpenAIProvider for development.');
    }

    this.client = new OpenAI({
      apiKey: apiKey || 'sk-mock-key-for-development',
    });
  }

  /**
   * LLMProvider実装: テキスト生成
   */
  async generate(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4000,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
      });

      const duration = Date.now() - startTime;
      const tokensUsed = {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      };

      const estimatedCost = this.calculateCost(tokensUsed.total, model);

      return {
        text: response.choices[0].message.content || '',
        model,
        tokensUsed,
        duration,
        estimatedCost,
        metadata: {
          finishReason: response.choices[0].finish_reason,
          id: response.id,
        },
      };
    } catch (error) {
      this.logger.error(`OpenAI generation failed: ${error.message}`);
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  /**
   * LLMProvider実装: コスト計算
   */
  calculateCost(tokens: number, model: string): number {
    const pricePerMillion: { [key: string]: number } = {
      'gpt-4o': 2.5, // Input $2.50/1M tokens
      'gpt-4o-mini': 0.15, // Input $0.15/1M tokens
      'gpt-4-turbo': 10.0, // Input $10.00/1M tokens
      'gpt-3.5-turbo': 0.5, // Input $0.50/1M tokens
    };

    const price = pricePerMillion[model] || pricePerMillion['gpt-4o-mini'];
    const usdCost = (tokens / 1_000_000) * price;
    const jpyRate = 150; // USD to JPY
    return parseFloat((usdCost * jpyRate).toFixed(2));
  }

  /**
   * LLMProvider実装: プロバイダ名取得
   */
  getProviderName(): string {
    return 'openai';
  }

  /**
   * LLMProvider実装: 利用可能モデル一覧
   */
  getAvailableModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }

  /**
   * LLMProvider実装: トークン数推定
   *
   * 簡易的な推定（英語: 4文字/token、日本語: 1.5文字/token）
   */
  estimateTokens(text: string): number {
    const japaneseChars = (text.match(/[\u3000-\u9FFF]/g) || []).length;
    const otherChars = text.length - japaneseChars;

    const japaneseTokens = japaneseChars / 1.5;
    const otherTokens = otherChars / 4;

    return Math.ceil(japaneseTokens + otherTokens);
  }

  /**
   * レガシーメソッド: 市場分析説明文生成（後方互換性のため保持）
   */
  async generateExplanation(data: {
    title: string;
    dataPoints: any[];
  }): Promise<string> {
    const prompt = `
あなたは補助金申請書類の作成を支援する専門家です。
以下のデータに基づき、市場分析の説明文を200-300字で生成してください。

【データ】
タイトル: ${data.title}
データポイント: ${JSON.stringify(data.dataPoints, null, 2)}

【要件】
- 数値は上記実データを正確に引用すること
- 専門的かつ客観的な表現を使用すること
- 「確実に」「必ず」「絶対に」などの断定表現は使用しないこと
- トレンドや成長率があれば言及すること
`;

    const response = await this.generate(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 500,
    });

    return response.text;
  }
}