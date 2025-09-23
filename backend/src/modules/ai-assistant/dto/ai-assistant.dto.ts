import { IsString, IsEnum, IsOptional, IsObject, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromptCategory } from '../prompts/templates';

// 課題分析リクエスト
export class AnalyzeIssuesDto {
  @ApiProperty({ description: '事業内容' })
  @IsString()
  businessDescription: string;

  @ApiProperty({ description: '困りごと・課題' })
  @IsString()
  painPoints: string;

  @ApiPropertyOptional({ description: '業種' })
  @IsOptional()
  @IsString()
  businessType?: string;
}

// 解決策提案リクエスト
export class SuggestSolutionsDto {
  @ApiProperty({ description: '現状課題', type: [Object] })
  @IsArray()
  currentIssues: any[];

  @ApiProperty({ description: '業種' })
  @IsString()
  businessType: string;

  @ApiProperty({ description: '補助金上限額' })
  @IsNumber()
  maxAmount: number;

  @ApiProperty({ description: '実施期間' })
  @IsString()
  implementationPeriod: string;
}

// 5W1H詳細化リクエスト
export class ElaboratePlanDto {
  @ApiProperty({ description: '施策概要' })
  @IsString()
  planSummary: string;

  @ApiProperty({ description: '解決したい課題' })
  @IsString()
  targetIssue: string;
}

// KPI提案リクエスト
export class SuggestKPIsDto {
  @ApiProperty({ description: '事業計画' })
  @IsString()
  businessPlan: string;

  @ApiProperty({ description: '期待される効果' })
  @IsString()
  expectedEffects: string;
}

// リスク分析リクエスト
export class AnalyzeRisksDto {
  @ApiProperty({ description: '事業計画' })
  @IsString()
  businessPlan: string;

  @ApiProperty({ description: '実施内容' })
  @IsString()
  implementationDetails: string;
}

// 市場分析リクエスト
export class AnalyzeMarketDto {
  @ApiProperty({ description: '事業内容' })
  @IsString()
  businessDescription: string;

  @ApiProperty({ description: 'ターゲット顧客' })
  @IsString()
  targetCustomer: string;

  @ApiPropertyOptional({ description: '地域' })
  @IsOptional()
  @IsString()
  region?: string;
}

// ガントチャート生成リクエスト
export class GenerateGanttDto {
  @ApiProperty({ description: '事業計画' })
  @IsString()
  businessPlan: string;

  @ApiProperty({ description: '実施期間' })
  @IsString()
  implementationPeriod: string;

  @ApiProperty({ description: '主要な取組', type: [String] })
  @IsArray()
  @IsString({ each: true })
  mainActivities: string[];
}

// 申請書サマリー生成リクエスト
export class GenerateSummaryDto {
  @ApiProperty({ description: '事業者情報' })
  @IsObject()
  companyInfo: any;

  @ApiProperty({ description: '現状課題', type: [Object] })
  @IsArray()
  currentIssues: any[];

  @ApiProperty({ description: '解決策' })
  @IsString()
  solutions: string;

  @ApiProperty({ description: '期待される効果' })
  @IsString()
  expectedEffects: string;

  @ApiProperty({ description: '必要な補助金額' })
  @IsNumber()
  requestedAmount: number;
}

// 汎用AIアシスタントリクエスト
export class AIAssistantRequestDto {
  @ApiProperty({ description: 'プロンプトカテゴリ', enum: PromptCategory })
  @IsEnum(PromptCategory)
  category: PromptCategory;

  @ApiProperty({ description: 'プロンプトテンプレート名' })
  @IsString()
  templateName: string;

  @ApiProperty({ description: 'プロンプト変数' })
  @IsObject()
  variables: Record<string, any>;

  @ApiPropertyOptional({ description: '追加の指示' })
  @IsOptional()
  @IsString()
  additionalInstructions?: string;
}

// AIレスポンス
export class AIResponseDto {
  @ApiProperty({ description: '生成されたコンテンツ' })
  content: string | any;

  @ApiProperty({ description: 'レスポンスタイプ' })
  type: 'text' | 'json' | 'markdown';

  @ApiProperty({ description: '使用されたプロンプトカテゴリ' })
  category: PromptCategory;

  @ApiProperty({ description: '使用トークン数' })
  tokensUsed: number;

  @ApiPropertyOptional({ description: '信頼度スコア' })
  confidence?: number;

  @ApiPropertyOptional({ description: '追加のメタデータ' })
  metadata?: Record<string, any>;
}

// バッチ処理リクエスト
export class BatchAIRequestDto {
  @ApiProperty({ description: 'リクエストリスト', type: [AIAssistantRequestDto] })
  @IsArray()
  requests: AIAssistantRequestDto[];

  @ApiPropertyOptional({ description: '並列処理フラグ' })
  @IsOptional()
  parallel?: boolean;
}

// エラーレスポンス
export class AIErrorResponseDto {
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;

  @ApiProperty({ description: 'エラーコード' })
  code: string;

  @ApiPropertyOptional({ description: '詳細情報' })
  details?: any;
}