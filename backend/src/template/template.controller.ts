import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TemplateService, TemplateContext } from './template.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../common/i18n/i18n.service';
import { 
  ResolveTemplateDto, 
  ValidateTemplateDto, 
  TemplateValidationResponseDto,
  ResolvedTemplateResponseDto
} from './dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomThrottlerGuard } from '../common/guards/throttler.guard';
import { TimezonedRequest } from '../common/middleware/timezone.middleware';

@ApiTags('template')
@Controller('template')
@UseGuards(CustomThrottlerGuard, RolesGuard)
@ApiBearerAuth()
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly prismaService: PrismaService,
    private readonly i18nService: I18nService,
  ) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate template syntax and security' })
  @ApiResponse({
    status: 200,
    description: 'Template validation result',
    type: TemplateValidationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid template' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async validateTemplate(
    @Body() validateDto: ValidateTemplateDto,
  ) {
    const validation = await this.templateService.validateTemplate(validateDto.template);
    
    return new BaseResponseDto(
      validation,
      validation.isValid ? 'Template is valid' : 'Template validation failed'
    );
  }

  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve template with application data' })
  @ApiResponse({
    status: 200,
    description: 'Template resolved successfully',
    type: ResolvedTemplateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Template resolution failed' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @Roles(Role.VIEWER, Role.EDITOR, Role.ADMIN)
  async resolveTemplate(
    @Body() resolveDto: ResolveTemplateDto,
    @Request() req: TimezonedRequest,
  ) {
    const startTime = Date.now();
    const userId = req.user?.id || 'anonymous';
    const userRole = req.user?.role || Role.VIEWER;

    // Build template context
    const context = await this.buildTemplateContext(
      resolveDto.applicationId,
      resolveDto.planId,
      userId,
      userRole,
      req
    );

    // Resolve template
    const content = await this.templateService.resolveTemplate(
      resolveDto.template,
      context,
      {
        timeout: resolveDto.timeout,
        strictMode: resolveDto.strictMode,
        sanitizeOutput: resolveDto.sanitizeOutput,
      }
    );

    const renderTime = Date.now() - startTime;
    const placeholders = this.templateService.extractPlaceholders(resolveDto.template);

    const response: ResolvedTemplateResponseDto = {
      content,
      metadata: {
        renderTime,
        placeholderCount: placeholders.length,
        templateSize: resolveDto.template.length,
      },
    };

    return new BaseResponseDto(
      response,
      'Template resolved successfully'
    );
  }

  @Post('placeholders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract placeholders from template' })
  @ApiResponse({
    status: 200,
    description: 'Placeholders extracted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid template' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async extractPlaceholders(
    @Body() validateDto: ValidateTemplateDto,
  ) {
    const placeholders = this.templateService.extractPlaceholders(validateDto.template);
    
    return new BaseResponseDto(
      { placeholders },
      `Extracted ${placeholders.length} placeholders`
    );
  }

  private async buildTemplateContext(
    applicationId: string,
    planId: string | undefined,
    userId: string,
    userRole: string,
    req: TimezonedRequest
  ): Promise<TemplateContext> {
    // Fetch application with access control
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
        applicant: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check access rights
    if (userRole !== 'ADMIN' && application.userId !== userId) {
      throw new Error('Access denied to this application');
    }

    const context: TemplateContext = {
      application,
      user: {
        id: userId,
        role: userRole,
        locale: req.locale || 'ja',
      },
      metadata: {
        generatedAt: this.i18nService.formatDateTime(new Date(), undefined, {
          locale: req.locale,
          timezone: req.timezone,
        }),
        locale: req.locale || 'ja',
        currency: 'JPY',
        timezone: req.timezone || 'Asia/Tokyo',
      },
    };

    // Add plan data if requested and accessible
    if (planId) {
      const plan = await this.prismaService.plan.findUnique({
        where: { id: planId },
        include: {
          actions: true,
          schedules: true,
          organization: true,
          risks: true,
        },
      });

      if (plan && (userRole === 'ADMIN' || plan.applicationId === applicationId)) {
        context.plan = plan;
      }
    }

    return context;
  }
}