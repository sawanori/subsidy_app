import { Injectable, Logger } from '@nestjs/common';
import {
  LLMProvider,
  LLMOptions,
  LLMResponse,
} from './llm.provider.interface';

/**
 * Mock OpenAI Provider for Development
 *
 * APIキーなしで開発環境で動作するモック実装
 * 実際のAI生成の代わりにテンプレートベースの応答を返す
 */
@Injectable()
export class MockOpenAIProvider implements LLMProvider {
  private readonly logger = new Logger(MockOpenAIProvider.name);
  private readonly defaultModel = 'gpt-4o-mini-mock';

  constructor() {
    this.logger.warn('🔧 Using MOCK OpenAI Provider - API calls will be simulated');
  }

  /**
   * LLMProvider実装: テキスト生成（モック）
   */
  async generate(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    // プロンプトからコンテキストを判断
    const mockText = this.generateMockResponse(prompt);
    const estimatedTokens = this.estimateTokens(prompt + mockText);

    // モック応答を生成（実際の処理時間をシミュレート）
    await this.simulateDelay(500, 1500);

    const duration = Date.now() - startTime;
    const tokensUsed = {
      prompt: Math.ceil(estimatedTokens * 0.4),
      completion: Math.ceil(estimatedTokens * 0.6),
      total: estimatedTokens,
    };

    const estimatedCost = this.calculateCost(tokensUsed.total, model);

    return {
      text: mockText,
      model,
      tokensUsed,
      duration,
      estimatedCost,
      metadata: {
        finishReason: 'stop',
        id: `mock-${Date.now()}`,
        isMock: true,
      },
    };
  }

  /**
   * モック応答生成
   */
  private generateMockResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // 市場分析関連
    if (lowerPrompt.includes('市場分析') || lowerPrompt.includes('market')) {
      return `対象市場は過去3年間で年平均成長率12.5%を示しており、今後も安定的な成長が見込まれます。特に地域密着型のサービス需要が高まっており、当社の強みを活かした事業展開が可能です。市場規模は約15億円と推定され、競合他社との差別化により市場シェア拡大の機会が存在します。`;
    }

    // 事業計画関連
    if (lowerPrompt.includes('事業計画') || lowerPrompt.includes('business plan')) {
      return `本事業では、既存事業で培ったノウハウを活かし、新規顧客層の開拓を目指します。初年度は基盤構築に注力し、2年目以降は本格的な販路拡大を図ります。デジタル技術の活用により業務効率を30%向上させ、顧客満足度の向上と収益性の改善を同時に実現します。`;
    }

    // KPI・目標関連
    if (lowerPrompt.includes('kpi') || lowerPrompt.includes('目標')) {
      return `売上高は初年度1,500万円、2年目2,500万円、3年目4,000万円を目標とします。顧客獲得数は年間100件、顧客満足度は90%以上を維持します。投資回収期間は約2年を見込んでおり、事業の持続可能性が確保されています。`;
    }

    // 課題・リスク関連
    if (lowerPrompt.includes('課題') || lowerPrompt.includes('リスク') || lowerPrompt.includes('risk')) {
      return `想定される課題として、①人材確保の難しさ、②初期投資の資金調達、③競合他社との差別化があります。これらに対し、段階的な人材育成プログラムの実施、補助金活用による資金確保、独自技術による差別化戦略を講じます。定期的なモニタリングにより早期の課題発見と対応を行います。`;
    }

    // 補助金関連
    if (lowerPrompt.includes('補助金') || lowerPrompt.includes('subsidy')) {
      return `本補助金を活用することで、新規設備導入とマーケティング活動を加速し、事業の早期立ち上げが可能となります。補助対象経費は総額500万円、うち補助金額は333万円を想定しています。自己資金と合わせた計画的な投資により、持続可能な事業基盤を構築します。`;
    }

    // スケジュール関連
    if (lowerPrompt.includes('スケジュール') || lowerPrompt.includes('schedule')) {
      return `事業実施期間は12ヶ月を予定しています。初期3ヶ月で設備導入と体制整備、次の3ヶ月で試験運用と改善、残り6ヶ月で本格稼働と拡大を進めます。各フェーズでKPIを設定し、定期的な進捗確認と必要に応じた軌道修正を行います。`;
    }

    // 組織・体制関連
    if (lowerPrompt.includes('組織') || lowerPrompt.includes('体制') || lowerPrompt.includes('organization')) {
      return `プロジェクト推進体制として、責任者1名、実務担当者3名、外部専門家2名で構成します。明確な役割分担と定期的なミーティングにより、円滑なプロジェクト進行を確保します。必要に応じて外部リソースを活用し、専門性の高い業務遂行を実現します。`;
    }

    // デフォルト応答
    return `本事業は、地域社会の課題解決と当社の持続的成長の両立を目指すものです。既存事業で培った強みを活かしつつ、新たな技術やサービスを導入することで、顧客価値の向上と競争力の強化を図ります。計画的な実施により、確実な成果創出を目指します。`;
  }

  /**
   * 遅延のシミュレート
   */
  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs) + minMs);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * LLMProvider実装: コスト計算（モック）
   */
  calculateCost(tokens: number, model: string): number {
    // モックなのでコストは0
    return 0;
  }

  /**
   * LLMProvider実装: プロバイダ名取得
   */
  getProviderName(): string {
    return 'openai-mock';
  }

  /**
   * LLMProvider実装: 利用可能モデル一覧
   */
  getAvailableModels(): string[] {
    return ['gpt-4o-mini-mock', 'gpt-4o-mock', 'gpt-4-turbo-mock'];
  }

  /**
   * LLMProvider実装: トークン数推定
   */
  estimateTokens(text: string): number {
    const japaneseChars = (text.match(/[\u3000-\u9FFF]/g) || []).length;
    const otherChars = text.length - japaneseChars;

    const japaneseTokens = japaneseChars / 1.5;
    const otherTokens = otherChars / 4;

    return Math.ceil(japaneseTokens + otherTokens);
  }

  /**
   * レガシーメソッド: 市場分析説明文生成（モック）
   */
  async generateExplanation(data: {
    title: string;
    dataPoints: any[];
  }): Promise<string> {
    const prompt = `市場分析: ${data.title}`;
    const response = await this.generate(prompt);
    return response.text;
  }
}