import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AIAssistantService } from './services/ai-assistant.service';
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
  AIErrorResponseDto,
} from './dto/ai-assistant.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('AI Assistant')
@Controller('api/ai-assistant')
@UseGuards(ThrottlerGuard)
export class AIAssistantController {
  constructor(private readonly aiService: AIAssistantService) {}

  @Post('analyze-issues')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '課題分析 - 事業の課題を分析し構造化' })
  @ApiResponse({ 
    status: 200, 
    description: '分析結果', 
    type: AIResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'バリデーションエラー',
    type: AIErrorResponseDto 
  })
  async analyzeIssues(@Body() dto: AnalyzeIssuesDto): Promise<AIResponseDto> {
    return this.aiService.analyzeIssues(dto);
  }

  @Post('suggest-solutions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '解決策提案 - 課題に対する解決策を提案' })
  @ApiResponse({ 
    status: 200, 
    description: '提案結果', 
    type: AIResponseDto 
  })
  async suggestSolutions(@Body() dto: SuggestSolutionsDto): Promise<AIResponseDto> {
    return this.aiService.suggestSolutions(dto);
  }

  @Post('elaborate-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '5W1H詳細化 - 施策を5W1H形式で具体化' })
  @ApiResponse({ 
    status: 200, 
    description: '詳細化結果', 
    type: AIResponseDto 
  })
  async elaboratePlan(@Body() dto: ElaboratePlanDto): Promise<AIResponseDto> {
    return this.aiService.elaboratePlan(dto);
  }

  @Post('suggest-kpis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'KPI提案 - 事業計画に適したKPIを提案' })
  @ApiResponse({ 
    status: 200, 
    description: 'KPI提案結果', 
    type: AIResponseDto 
  })
  async suggestKPIs(@Body() dto: SuggestKPIsDto): Promise<AIResponseDto> {
    return this.aiService.suggestKPIs(dto);
  }

  @Post('analyze-risks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'リスク分析 - 事業計画のリスクを分析' })
  @ApiResponse({ 
    status: 200, 
    description: 'リスク分析結果', 
    type: AIResponseDto 
  })
  async analyzeRisks(@Body() dto: AnalyzeRisksDto): Promise<AIResponseDto> {
    return this.aiService.analyzeRisks(dto);
  }

  @Post('analyze-market')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '市場分析 - 対象市場を分析' })
  @ApiResponse({ 
    status: 200, 
    description: '市場分析結果', 
    type: AIResponseDto 
  })
  async analyzeMarket(@Body() dto: AnalyzeMarketDto): Promise<AIResponseDto> {
    return this.aiService.analyzeMarket(dto);
  }

  @Post('generate-gantt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ガントチャート生成 - 実施スケジュールを生成' })
  @ApiResponse({ 
    status: 200, 
    description: 'スケジュール生成結果', 
    type: AIResponseDto 
  })
  async generateGantt(@Body() dto: GenerateGanttDto): Promise<AIResponseDto> {
    return this.aiService.generateGantt(dto);
  }

  @Post('generate-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '申請書サマリー生成 - 説得力のあるサマリーを生成' })
  @ApiResponse({ 
    status: 200, 
    description: 'サマリー生成結果', 
    type: AIResponseDto 
  })
  async generateSummary(@Body() dto: GenerateSummaryDto): Promise<AIResponseDto> {
    return this.aiService.generateSummary(dto);
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '汎用AI処理 - カスタムプロンプトで処理' })
  @ApiResponse({ 
    status: 200, 
    description: '処理結果', 
    type: AIResponseDto 
  })
  async processRequest(@Body() dto: AIAssistantRequestDto): Promise<AIResponseDto> {
    return this.aiService.processRequest(dto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'バッチ処理 - 複数のAIリクエストを処理' })
  @ApiResponse({ 
    status: 200, 
    description: 'バッチ処理結果', 
    type: [AIResponseDto] 
  })
  async processBatch(@Body() dto: BatchAIRequestDto): Promise<AIResponseDto[]> {
    return this.aiService.processBatch(dto);
  }
}