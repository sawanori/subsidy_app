import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { PlaceholderMapping } from '../template.service';

export class ResolveTemplateDto {
  @ApiProperty({
    description: 'Template content with Handlebars syntax',
    example: '<h1>{{application.title}}</h1><p>Amount: {{formatCurrency application.amount}}</p>',
  })
  @IsString()
  template: string;

  @ApiProperty({
    description: 'Application ID for context data',
    example: 'app-123',
  })
  @IsString()
  applicationId: string;

  @ApiProperty({
    description: 'Plan ID for context data (optional)',
    example: 'plan-456',
    required: false,
  })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({
    description: 'Enable strict mode (fail on missing variables)',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  strictMode?: boolean = false;

  @ApiProperty({
    description: 'Sanitize HTML output',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  sanitizeOutput?: boolean = true;

  @ApiProperty({
    description: 'Rendering timeout in milliseconds',
    minimum: 1000,
    maximum: 30000,
    default: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(30000)
  timeout?: number = 10000;
}

export class ValidateTemplateDto {
  @ApiProperty({
    description: 'Template content to validate',
    example: '<h1>{{application.title}}</h1><p>{{invalidHelper application.data}}</p>',
  })
  @IsString()
  template: string;
}

export class TemplateValidationResponseDto {
  @ApiProperty({ description: 'Whether template is valid' })
  isValid: boolean;

  @ApiProperty({ 
    description: 'Validation errors',
    type: [String],
    example: ['Template syntax error: Missing closing tag', 'Unsupported helper: invalidHelper']
  })
  errors: string[];

  @ApiProperty({ 
    description: 'Validation warnings',
    type: [String],
    example: ['Template is large and may impact performance']
  })
  warnings: string[];

  @ApiProperty({ 
    description: 'Extracted placeholders',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        key: { type: 'string', example: 'application.title' },
        path: { type: 'string', example: 'application.title' },
        type: { type: 'string', enum: ['string', 'number', 'date', 'currency', 'boolean'], example: 'string' },
        required: { type: 'boolean', example: true },
        description: { type: 'string', example: 'Auto-detected string field from application.title' }
      }
    }
  })
  placeholders: PlaceholderMapping[];
}

export class ResolvedTemplateResponseDto {
  @ApiProperty({ 
    description: 'Resolved template content',
    example: '<h1>My Application</h1><p>Amount: ¥1,000,000</p>'
  })
  content: string;

  @ApiProperty({ 
    description: 'Rendering metadata',
    type: 'object',
    properties: {
      renderTime: { type: 'number', example: 145 },
      placeholderCount: { type: 'number', example: 12 },
      templateSize: { type: 'number', example: 2048 }
    }
  })
  metadata: {
    renderTime: number;
    placeholderCount: number;
    templateSize: number;
  };
}