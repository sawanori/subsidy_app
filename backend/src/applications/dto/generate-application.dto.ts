import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';

export enum OutputFormat {
  PDF = 'pdf',
  DOCX = 'docx',
}

export enum TemplateType {
  STANDARD = 'standard',
  DETAILED = 'detailed',
  SUMMARY = 'summary',
}

export class GenerateApplicationDto {
  @ApiProperty({
    description: 'Output format',
    enum: OutputFormat,
    default: OutputFormat.PDF,
    required: false,
  })
  @IsOptional()
  @IsEnum(OutputFormat)
  format?: OutputFormat = OutputFormat.PDF;

  @ApiProperty({
    description: 'Template type',
    enum: TemplateType,
    default: TemplateType.STANDARD,
    required: false,
  })
  @IsOptional()
  @IsEnum(TemplateType)
  template?: TemplateType = TemplateType.STANDARD;

  @ApiProperty({
    description: 'Locale for generation',
    default: 'ja',
    required: false,
  })
  @IsOptional()
  @IsString()
  locale?: string = 'ja';

  @ApiProperty({
    description: 'Include digital signature',
    default: false,
    required: false,
  })
  @IsOptional()
  includeSignature?: boolean = false;
}

export class GenerationResponseDto {
  @ApiProperty({ description: 'Generation job ID' })
  jobId: string;

  @ApiProperty({ description: 'Generation status' })
  status: 'queued' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: 'Download URL when completed', required: false })
  downloadUrl?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Error message if failed', required: false })
  error?: string;
}