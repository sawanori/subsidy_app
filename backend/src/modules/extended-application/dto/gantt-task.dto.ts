import { IsString, IsNumber, IsBoolean, IsDate, IsEnum, IsOptional, IsArray, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TaskType {
  PHASE = 'PHASE',
  TASK = 'TASK',
  SUBTASK = 'SUBTASK',
  MILESTONE = 'MILESTONE',
}

export class TaskDependencyDto {
  @ApiProperty({ description: 'タスクID' })
  @IsString()
  taskId: string;

  @ApiProperty({ description: '依存タイプ', enum: ['FS', 'SS', 'FF', 'SF'] })
  @IsString()
  type: 'FS' | 'SS' | 'FF' | 'SF';
}

export class CreateGanttTaskDto {
  @ApiProperty({ description: '申請ID' })
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty({ description: 'タスク名' })
  @IsString()
  @IsNotEmpty()
  taskName: string;

  @ApiPropertyOptional({ description: 'タスク説明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'タスクタイプ', enum: TaskType })
  @IsEnum(TaskType)
  taskType: TaskType = TaskType.TASK;

  @ApiProperty({ description: '開始日' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: '終了日' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ description: '期間（日数）' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  duration: number;

  @ApiProperty({ description: '進捗率（0-100）' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progress: number = 0;

  @ApiPropertyOptional({ description: '依存関係', type: [TaskDependencyDto] })
  @IsOptional()
  @IsArray()
  @Type(() => TaskDependencyDto)
  dependencies?: TaskDependencyDto[];

  @ApiPropertyOptional({ description: '親タスクID' })
  @IsOptional()
  @IsString()
  parentTaskId?: string;

  @ApiProperty({ description: '担当者' })
  @IsString()
  @IsNotEmpty()
  assignee: string;

  @ApiPropertyOptional({ description: '担当者の役割' })
  @IsOptional()
  @IsString()
  assigneeRole?: string;

  @ApiPropertyOptional({ description: '必要リソース' })
  @IsOptional()
  resources?: Record<string, any>;

  @ApiPropertyOptional({ description: 'カラーコード（#RRGGBB）' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ description: 'マイルストーンフラグ' })
  @IsBoolean()
  milestone: boolean = false;

  @ApiProperty({ description: 'クリティカルパスフラグ' })
  @IsBoolean()
  critical: boolean = false;

  @ApiProperty({ description: '表示順序' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderIndex: number;
}

export class UpdateGanttTaskDto extends CreateGanttTaskDto {}

export class GanttTaskResponseDto extends CreateGanttTaskDto {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '作成日時' })
  createdAt: Date;

  @ApiProperty({ description: '更新日時' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '遅延日数' })
  delayDays?: number;

  @ApiPropertyOptional({ description: '完了予定日' })
  estimatedCompletionDate?: Date;
}

export class CreateGanttTasksDto {
  @ApiProperty({ description: 'ガントタスクリスト', type: [CreateGanttTaskDto] })
  @Type(() => CreateGanttTaskDto)
  tasks: CreateGanttTaskDto[];
}