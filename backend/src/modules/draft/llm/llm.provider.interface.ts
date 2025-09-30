/**
 * LLMプロバイダ抽象化インターフェース
 *
 * 複数のLLMプロバイダ（OpenAI, Anthropic等）を統一的に扱うための抽象化
 */

/**
 * LLM生成オプション
 */
export interface LLMOptions {
  /**
   * 使用するモデル名
   * @example 'gpt-4o', 'gpt-4o-mini', 'claude-3-opus'
   */
  model?: string;

  /**
   * 温度パラメータ（0.0-2.0）
   * 低いほど決定的、高いほどランダム
   * @default 0.7
   */
  temperature?: number;

  /**
   * 最大トークン数
   * @default 4000
   */
  maxTokens?: number;

  /**
   * Top-Pサンプリング（0.0-1.0）
   * @default 1.0
   */
  topP?: number;

  /**
   * Frequency penalty（-2.0-2.0）
   * 繰り返しを減らす
   * @default 0
   */
  frequencyPenalty?: number;

  /**
   * Presence penalty（-2.0-2.0）
   * 新しいトピックへの移行を促進
   * @default 0
   */
  presencePenalty?: number;
}

/**
 * LLM生成結果
 */
export interface LLMResponse {
  /**
   * 生成されたテキスト
   */
  text: string;

  /**
   * 使用したモデル名
   */
  model: string;

  /**
   * 使用トークン数
   */
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };

  /**
   * 生成にかかった時間（ミリ秒）
   */
  duration: number;

  /**
   * 推定コスト（円）
   */
  estimatedCost: number;

  /**
   * メタデータ
   */
  metadata?: {
    finishReason?: string;
    [key: string]: any;
  };
}

/**
 * LLMプロバイダインターフェース
 */
export interface LLMProvider {
  /**
   * テキスト生成
   *
   * @param prompt - プロンプト文字列
   * @param options - 生成オプション
   * @returns 生成結果
   */
  generate(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * トークン使用量とコストを計算
   *
   * @param tokens - トークン数
   * @param model - モデル名
   * @returns コスト（円）
   */
  calculateCost(tokens: number, model: string): number;

  /**
   * プロバイダ名を取得
   *
   * @returns プロバイダ名（例: 'openai', 'anthropic'）
   */
  getProviderName(): string;

  /**
   * 利用可能なモデル一覧を取得
   *
   * @returns モデル名の配列
   */
  getAvailableModels(): string[];

  /**
   * プロンプトのトークン数を推定
   *
   * @param text - テキスト
   * @returns 推定トークン数
   */
  estimateTokens(text: string): number;
}

/**
 * ストリーミング対応LLMプロバイダ（オプション）
 */
export interface StreamingLLMProvider extends LLMProvider {
  /**
   * ストリーミング生成
   *
   * @param prompt - プロンプト文字列
   * @param options - 生成オプション
   * @param onChunk - チャンクコールバック
   * @returns 最終的な生成結果
   */
  generateStream(
    prompt: string,
    options: LLMOptions,
    onChunk: (chunk: string) => void,
  ): Promise<LLMResponse>;
}