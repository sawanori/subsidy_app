import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getOpenAIConfig } from '../config/openai.config';
import { PROMPT_TEMPLATES, PromptCategory } from '../prompts/templates';
import {
  AnalyzeIssuesDto,
  SuggestSolutionsDto,
  ElaboratePlanDto,
  SuggestKPIsDto,
  AnalyzeRisksDto,
  AnalyzeMarketDto,
  GenerateGanttDto,
  GenerateSummaryDto,
  AIAssistantRequestDto,
  AIResponseDto,
  BatchAIRequestDto,
} from '../dto/ai-assistant.dto';

@Injectable()
export class AIAssistantService {
  private openAIConfig;
  private openai: any;

  constructor(private configService: ConfigService) {
    this.openAIConfig = getOpenAIConfig(configService);
    this.initializeOpenAI();
  }

  private async initializeOpenAI() {
    try {
      // 動的インポート（OpenAI SDKがインストールされている場合）
      const { OpenAI } = await import('openai').catch(() => ({ OpenAI: null }));
      
      if (OpenAI && this.openAIConfig.apiKey) {
        this.openai = new OpenAI({
          apiKey: this.openAIConfig.apiKey,
        });
      }
    } catch (error) {
      console.warn('OpenAI SDK not initialized:', error);
    }
  }

  // 課題分析
  async analyzeIssues(dto: AnalyzeIssuesDto): Promise<AIResponseDto> {
    const prompt = this.buildPrompt(PROMPT_TEMPLATES.ANALYZE_ISSUES, {
      businessDescription: dto.businessDescription,
      painPoints: dto.painPoints,
    });

    return this.generateResponse(prompt, PromptCategory.ANALYSIS);
  }

  // 解決策提案
  async suggestSolutions(dto: SuggestSolutionsDto): Promise<AIResponseDto> {
    const prompt = this.buildPrompt(PROMPT_TEMPLATES.SUGGEST_SOLUTIONS, {
      currentIssues: JSON.stringify(dto.currentIssues),
      businessType: dto.businessType,
      maxAmount: dto.maxAmount.toString(),
      implementationPeriod: dto.implementationPeriod,
    });

    return this.generateResponse(prompt, PromptCategory.SUGGESTION);
  }

  // 5W1H詳細化
  async elaboratePlan(dto: ElaboratePlanDto): Promise<AIResponseDto> {
    const prompt = this.buildPrompt(PROMPT_TEMPLATES.ELABORATE_PLAN, {
      planSummary: dto.planSummary,
      targetIssue: dto.targetIssue,
    });

    return this.generateResponse(prompt, PromptCategory.ELABORATION);
  }

  // KPI提案
  async suggestKPIs(dto: SuggestKPIsDto): Promise<AIResponseDto> {
    const prompt = this.buildPrompt(PROMPT_TEMPLATES.SUGGEST_KPIS, {
      businessPlan: dto.businessPlan,
      expectedEffects: dto.expectedEffects,
    });

    return this.generateResponse(prompt, PromptCategory.SUGGESTION);
  }

  // リスク分析
  async analyzeRisks(dto: AnalyzeRisksDto): Promise<AIResponseDto> {
    const prompt = this.buildPrompt(PROMPT_TEMPLATES.ANALYZE_RISKS, {
      businessPlan: dto.businessPlan,
      implementationDetails: dto.implementationDetails,
    });

    return this.generateResponse(prompt, PromptCategory.RISK);
  }

  // 市場分析
  async analyzeMarket(dto: AnalyzeMarketDto): Promise<AIResponseDto> {
    const prompt = this.buildPrompt(PROMPT_TEMPLATES.ANALYZE_MARKET, {
      businessDescription: dto.businessDescription,
      targetCustomer: dto.targetCustomer,
      region: dto.region || '日本全国',
    });

    return this.generateResponse(prompt, PromptCategory.MARKET);
  }

  // ガントチャート生成
  async generateGantt(dto: GenerateGanttDto): Promise<AIResponseDto> {
    const prompt = this.buildPrompt(PROMPT_TEMPLATES.GENERATE_GANTT, {
      businessPlan: dto.businessPlan,
      implementationPeriod: dto.implementationPeriod,
      mainActivities: dto.mainActivities.join('\n'),
    });

    return this.generateResponse(prompt, PromptCategory.PLANNING);
  }

  // 申請書サマリー生成
  async generateSummary(dto: GenerateSummaryDto): Promise<AIResponseDto> {
    const prompt = this.buildPrompt(PROMPT_TEMPLATES.GENERATE_SUMMARY, {
      companyInfo: JSON.stringify(dto.companyInfo),
      currentIssues: JSON.stringify(dto.currentIssues),
      solutions: dto.solutions,
      expectedEffects: dto.expectedEffects,
      requestedAmount: dto.requestedAmount.toString(),
    });

    return this.generateResponse(prompt, PromptCategory.SUMMARY);
  }

  // 汎用AIアシスタント
  async processRequest(dto: AIAssistantRequestDto): Promise<AIResponseDto> {
    const template = this.getTemplate(dto.templateName);
    if (!template) {
      throw new BadRequestException(`Template ${dto.templateName} not found`);
    }

    let prompt = this.buildPrompt(template, dto.variables);
    
    if (dto.additionalInstructions) {
      prompt += `\n\n追加の指示:\n${dto.additionalInstructions}`;
    }

    return this.generateResponse(prompt, dto.category);
  }

  // バッチ処理
  async processBatch(dto: BatchAIRequestDto): Promise<AIResponseDto[]> {
    if (dto.parallel) {
      return Promise.all(
        dto.requests.map(request => this.processRequest(request))
      );
    } else {
      const results: AIResponseDto[] = [];
      for (const request of dto.requests) {
        results.push(await this.processRequest(request));
      }
      return results;
    }
  }

  // プロンプトビルダー
  private buildPrompt(template: string, variables: Record<string, string>): string {
    let prompt = template;
    
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    
    return prompt;
  }

  // テンプレート取得
  private getTemplate(name: string): string | null {
    return PROMPT_TEMPLATES[name] || null;
  }

  // AI応答生成
  private async generateResponse(
    prompt: string,
    category: PromptCategory
  ): Promise<AIResponseDto> {
    try {
      // OpenAI APIが設定されていない場合はモックレスポンス
      if (!this.openai) {
        return this.generateMockResponse(prompt, category);
      }

      const completion = await this.openai.chat.completions.create({
        model: this.openAIConfig.model,
        messages: [
          {
            role: 'system',
            content: 'あなたは日本の補助金申請の専門家です。具体的で実践的なアドバイスを提供してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.openAIConfig.maxTokens,
        temperature: this.openAIConfig.temperature,
      });

      const content = completion.choices[0].message.content;
      const tokensUsed = completion.usage?.total_tokens || 0;

      // JSONパース試行
      let parsedContent = content;
      let responseType: 'text' | 'json' | 'markdown' = 'text';
      
      try {
        parsedContent = JSON.parse(content);
        responseType = 'json';
      } catch {
        // JSONではない場合はテキストとして扱う
        if (content.includes('#') || content.includes('```')) {
          responseType = 'markdown';
        }
      }

      return {
        content: parsedContent,
        type: responseType,
        category,
        tokensUsed,
        confidence: 0.85, // 仮の信頼度
        metadata: {
          model: this.openAIConfig.model,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw new InternalServerErrorException('AI応答の生成に失敗しました');
    }
  }

  // モックレスポンス生成（開発用）
  private generateMockResponse(
    prompt: string,
    category: PromptCategory
  ): AIResponseDto {
    const mockResponses = {
      [PromptCategory.ANALYSIS]: {
        currentIssues: [
          {
            category: '効率',
            description: '手作業による在庫管理で時間がかかっている',
            impact: '月間40時間の作業時間',
          },
          {
            category: '品質',
            description: '在庫データの不整合によるミス',
            impact: '月3-5件の出荷ミス',
          },
        ],
        rootCause: 'システム化の遅れと人的リソースへの過度な依存',
        recommendedSolution: 'クラウド型在庫管理システムの導入',
      },
      [PromptCategory.SUGGESTION]: {
        solutions: [
          {
            title: 'クラウド型システム導入',
            approach: '段階的導入アプローチ',
            uniqueValue: 'AIによる需要予測機能',
            feasibility: '高',
          },
        ],
      },
      [PromptCategory.ELABORATION]: {
        what: 'クラウド型在庫管理システムの導入',
        why: '業務効率化とミス削減のため',
        who: 'IT推進室と現場担当者',
        where: '本社倉庫および各営業所',
        when: '2025年3月末まで',
        how: '3段階（要件定義→導入→運用）で実施',
        expectedResult: '作業時間50%削減、ミスゼロ化',
      },
    };

    return {
      content: mockResponses[category] || { message: 'モックレスポンス' },
      type: 'json',
      category,
      tokensUsed: 0,
      confidence: 1.0,
      metadata: {
        mock: true,
        timestamp: new Date().toISOString(),
      },
    };
  }
}