import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CurrentIssueDto {
  @ApiProperty({ description: '課題カテゴリ' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: '課題の説明' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '影響度' })
  @IsString()
  @IsNotEmpty()
  impact: string;
}

export class LogicTreeNodeDto {
  @ApiProperty({ description: 'ノードID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'ノードタイプ', enum: ['issue', 'cause', 'solution'] })
  @IsString()
  type: 'issue' | 'cause' | 'solution';

  @ApiProperty({ description: 'ノードの内容' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '子ノード', type: [LogicTreeNodeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogicTreeNodeDto)
  children?: LogicTreeNodeDto[];
}

export class CreatePurposeBackgroundDto {
  @ApiProperty({ description: '申請ID' })
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty({ description: '現状課題', type: [CurrentIssueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentIssueDto)
  currentIssues: CurrentIssueDto[];

  @ApiProperty({ description: '具体的な困りごと' })
  @IsString()
  @IsNotEmpty()
  painPoints: string;

  @ApiPropertyOptional({ description: '根本原因' })
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiProperty({ description: '解決策' })
  @IsString()
  @IsNotEmpty()
  solution: string;

  @ApiProperty({ description: 'アプローチ方法' })
  @IsString()
  @IsNotEmpty()
  approach: string;

  @ApiPropertyOptional({ description: '独自性・差別化ポイント' })
  @IsOptional()
  @IsString()
  uniqueValue?: string;

  @ApiPropertyOptional({ description: 'ロジックツリー', type: LogicTreeNodeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LogicTreeNodeDto)
  logicTree?: LogicTreeNodeDto;
}

export class UpdatePurposeBackgroundDto extends CreatePurposeBackgroundDto {}

export class PurposeBackgroundResponseDto extends CreatePurposeBackgroundDto {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '作成日時' })
  createdAt: Date;

  @ApiProperty({ description: '更新日時' })
  updatedAt: Date;
}