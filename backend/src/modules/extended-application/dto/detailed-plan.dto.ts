import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateDetailedPlanDto {
  @ApiProperty({ description: '申請ID' })
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty({ description: '何を' })
  @IsString()
  @IsNotEmpty()
  what: string;

  @ApiProperty({ description: 'なぜ' })
  @IsString()
  @IsNotEmpty()
  why: string;

  @ApiProperty({ description: '誰が' })
  @IsString()
  @IsNotEmpty()
  who: string;

  @ApiProperty({ description: 'どこで' })
  @IsString()
  @IsNotEmpty()
  where: string;

  @ApiProperty({ description: 'いつまでに' })
  @IsString()
  @IsNotEmpty()
  when: string;

  @ApiProperty({ description: 'どのように' })
  @IsString()
  @IsNotEmpty()
  how: string;

  @ApiProperty({ description: '優先度', enum: Priority })
  @IsEnum(Priority)
  priority: Priority = Priority.MEDIUM;

  @ApiProperty({ description: 'カテゴリ' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: '期待される成果' })
  @IsString()
  @IsNotEmpty()
  expectedResult: string;

  @ApiPropertyOptional({ description: '前提条件' })
  @IsOptional()
  @IsString()
  prerequisite?: string;

  @ApiPropertyOptional({ description: '関連タスクID', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedTaskIds?: string[];

  @ApiProperty({ description: '表示順序' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex: number;
}

export class UpdateDetailedPlanDto extends CreateDetailedPlanDto {}

export class DetailedPlanResponseDto extends CreateDetailedPlanDto {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '作成日時' })
  createdAt: Date;

  @ApiProperty({ description: '更新日時' })
  updatedAt: Date;
}

export class CreateDetailedPlansDto {
  @ApiProperty({ description: '詳細計画リスト', type: [CreateDetailedPlanDto] })
  @IsArray()
  @Type(() => CreateDetailedPlanDto)
  plans: CreateDetailedPlanDto[];
}