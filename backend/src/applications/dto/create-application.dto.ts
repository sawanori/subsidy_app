import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApplicationStatus } from '@generated/prisma';

export class CreateApplicationDto {
  @ApiProperty({ description: '申請タイトル' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'ロケール', required: false })
  @IsString()
  @IsOptional()
  locale?: string = 'ja';

  @ApiProperty({ description: '申請ステータス', enum: ApplicationStatus, required: false })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus = ApplicationStatus.DRAFT;
}