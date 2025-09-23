import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsPositive, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActionDto {
  @ApiProperty({ description: 'アクション名' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '目的' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  purpose: string;

  @ApiProperty({ description: '期待成果物' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  deliverable: string;

  @ApiProperty({ description: '根拠・エビデンス' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  evidence: string;

  @ApiProperty({ description: '担当者' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  assignee: string;

  @ApiProperty({ description: '場所', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ description: '方法', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  method?: string;
}

export class CreateKpiDto {
  @ApiProperty({ description: 'KPI名' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '単位' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unit: string;

  @ApiProperty({ description: '目標値' })
  @IsNumber()
  @IsPositive()
  targetValue: number;

  @ApiProperty({ description: '根拠・計算式' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rationale: string;

  @ApiProperty({ description: '測定方法' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  measurementMethod: string;
}

export class CreatePlanDto {
  @ApiProperty({ description: 'プラン名' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '背景' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  background: string;

  @ApiProperty({ description: '解決策' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  solution: string;

  @ApiProperty({ description: '期待効果' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  expectedOutcome: string;

  @ApiProperty({ description: 'アクション一覧', type: [CreateActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActionDto)
  actions: CreateActionDto[];

  @ApiProperty({ description: 'KPI一覧', type: [CreateKpiDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKpiDto)
  kpis: CreateKpiDto[];

  @ApiProperty({ description: '申請ID' })
  @IsString()
  @IsNotEmpty()
  applicationId: string;
}