import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BaselineBuilderService } from './services/baseline-builder.service';
import { IntentStructurerService } from './services/intent-structurer.service';
import { KPIGeneratorService } from './services/kpi-generator.service';
import { KPIValidatorService } from './services/kpi-validator.service';
import { PlanGeneratorService } from './services/plan-generator.service';
import { TextPreflightService } from './services/text-preflight.service';
import { AuditService } from './services/audit.service';
import {
  AutoPlanRequestDto,
  AutoPlanResponseDto,
  BaselineBuildRequestDto,
  BaselineBuildResponseDto,
  ValidateKpisRequestDto,
  ValidateKpisResponseDto,
  ValidateTextRequestDto,
  ValidateTextResponseDto,
} from './dto/auto-plan.dto';

@Controller('v1')
export class AutoPlanController {
  constructor(
    private readonly baselineBuilder: BaselineBuilderService,
    private readonly intentStructurer: IntentStructurerService,
    private readonly kpiGenerator: KPIGeneratorService,
    private readonly kpiValidator: KPIValidatorService,
    private readonly planGenerator: PlanGeneratorService,
    private readonly textPreflight: TextPreflightService,
    private readonly audit: AuditService,
  ) {}

  @Post('baseline/build')
  @HttpCode(HttpStatus.OK)
  async buildBaseline(@Body() dto: BaselineBuildRequestDto): Promise<BaselineBuildResponseDto> {
    const baselines = await this.baselineBuilder.build(dto.application_id);
    return { baselines };
  }

  @Post('plan/auto')
  @HttpCode(HttpStatus.OK)
  async autoPlan(@Body() dto: AutoPlanRequestDto): Promise<AutoPlanResponseDto> {
    // 1) Baseline（推定）
    const baselines = await this.baselineBuilder.build(dto.application_id);

    // 2) 取組内容の正規化
    const intents = this.intentStructurer.structure(dto.initiatives);

    // 3) KPI生成
    const kpis = this.kpiGenerator.generate({ baselines, intents, constraints: dto.constraints, prefer: dto.prefer });

    // 4) KPI検証（警告/修正案のみ返し、ここではエラーにしない）
    const kpiValidation = this.kpiValidator.validate({ kpis, months: dto.constraints?.months ?? 6 });

    // 5) 事業計画生成
    const plan = await this.planGenerator.generate({ baselines, intents, kpis, constraints: dto.constraints });

    // 6) 監査（非同期にしても可、ここでは簡易ログ）
    this.audit.record({ applicationId: dto.application_id, baselines, intents, kpis, plan });

    // 7) 返却（バリデーション結果は含めず、必要なら別APIで詳細確認）
    return {
      kpis: kpis,
      plan,
      citations: plan.citations || [],
      warnings: kpiValidation.warnings || [],
      fixes: kpiValidation.fixes || [],
    };
  }

  @Post('validate/kpis')
  @HttpCode(HttpStatus.OK)
  async validateKpis(@Body() dto: ValidateKpisRequestDto): Promise<ValidateKpisResponseDto> {
    const result = this.kpiValidator.validate({ kpis: dto.kpis, months: dto.constraints?.months ?? 6 });
    return result;
  }

  @Post('validate/text')
  @HttpCode(HttpStatus.OK)
  async validateText(@Body() dto: ValidateTextRequestDto): Promise<ValidateTextResponseDto> {
    return this.textPreflight.validate(dto);
  }
}

