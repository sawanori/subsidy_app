import { TemplateService } from './template.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../common/i18n/i18n.service';
import { ResolveTemplateDto, ValidateTemplateDto, ResolvedTemplateResponseDto } from './dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { TimezonedRequest } from '../common/middleware/timezone.middleware';
export declare class TemplateController {
    private readonly templateService;
    private readonly prismaService;
    private readonly i18nService;
    constructor(templateService: TemplateService, prismaService: PrismaService, i18nService: I18nService);
    validateTemplate(validateDto: ValidateTemplateDto): Promise<BaseResponseDto<import("./template.service").TemplateValidationResult>>;
    resolveTemplate(resolveDto: ResolveTemplateDto, req: TimezonedRequest): Promise<BaseResponseDto<ResolvedTemplateResponseDto>>;
    extractPlaceholders(validateDto: ValidateTemplateDto): Promise<BaseResponseDto<{
        placeholders: import("./template.service").PlaceholderMapping[];
    }>>;
    private buildTemplateContext;
}
