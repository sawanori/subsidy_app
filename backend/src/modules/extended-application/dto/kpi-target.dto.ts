import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum KpiCategory {
  SALES = 'SALES',
  CUSTOMERS = 'CUSTOMERS',
  UNIT_PRICE = 'UNIT_PRICE',
  CONVERSION = 'CONVERSION',
  RETENTION = 'RETENTION',
  EFFICIENCY = 'EFFICIENCY',
  QUALITY = 'QUALITY',
  CUSTOM = 'CUSTOM',
}

export enum ChartType {
  LINE = 'LINE',
  BAR = 'BAR',
  AREA = 'AREA',
  PIE = 'PIE',
  GAUGE = 'GAUGE',
}

export class CreateKpiTargetDto {
  @ApiProperty({ description: '申請ID' })
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty({ description: 'KPIカテゴリ', enum: KpiCategory })
  @IsEnum(KpiCategory)
  category: KpiCategory;

  @ApiProperty({ description: '指標名' })
  @IsString()
  @IsNotEmpty()
  metric: string;

  @ApiProperty({ description: '単位' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ description: '現在値' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentValue: number;

  @ApiProperty({ description: '1年目目標' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  year1Target: number;

  @ApiPropertyOptional({ description: '2年目目標' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  year2Target?: number;

  @ApiPropertyOptional({ description: '3年目目標' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  year3Target?: number;

  @ApiPropertyOptional({ description: '計算式' })
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiPropertyOptional({ description: '前提条件' })
  @IsOptional()
  @IsObject()
  assumptions?: Record<string, any>;

  @ApiProperty({ description: 'グラフタイプ', enum: ChartType })
  @IsEnum(ChartType)
  chartType: ChartType = ChartType.LINE;

  @ApiProperty({ description: '表示順序' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  displayOrder: number;
}

export class UpdateKpiTargetDto extends CreateKpiTargetDto {}

export class KpiTargetResponseDto extends CreateKpiTargetDto {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '作成日時' })
  createdAt: Date;

  @ApiProperty({ description: '更新日時' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '成長率（1年目）' })
  growthRateYear1?: number;

  @ApiPropertyOptional({ description: '成長率（2年目）' })
  growthRateYear2?: number;

  @ApiPropertyOptional({ description: '成長率（3年目）' })
  growthRateYear3?: number;
}

export class CreateKpiTargetsDto {
  @ApiProperty({ description: 'KPI目標リスト', type: [CreateKpiTargetDto] })
  @Type(() => CreateKpiTargetDto)
  targets: CreateKpiTargetDto[];
}