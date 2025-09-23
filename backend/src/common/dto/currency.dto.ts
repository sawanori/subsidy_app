import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Base class for DTOs that contain currency amounts
 */
export class CurrencyDto {
  @ApiProperty({
    description: 'Amount in JPY (no decimal places)',
    example: 1000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) => {
    // Ensure JPY amounts are always integers (no decimals)
    if (typeof value === 'number') {
      return Math.round(value);
    }
    return value;
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    default: 'JPY',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string = 'JPY';
}

/**
 * DTO for budget-related operations
 */
export class BudgetDto extends CurrencyDto {
  @ApiProperty({
    description: 'Budget category',
    example: 'personnel',
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Budget description',
    example: 'Personnel costs for project',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Response DTO that includes formatted currency
 */
export class CurrencyResponseDto {
  @ApiProperty({ description: 'Raw amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ 
    description: 'Formatted amount for display',
    example: '￥1,000,000'
  })
  amount_formatted?: string;

  constructor(amount: number, currency: string = 'JPY', formatted?: string) {
    this.amount = amount;
    this.currency = currency;
    this.amount_formatted = formatted;
  }
}