"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const template_service_1 = require("./template.service");
const prisma_service_1 = require("../prisma/prisma.service");
const i18n_service_1 = require("../common/i18n/i18n.service");
const dto_1 = require("./dto");
const base_response_dto_1 = require("../common/dto/base-response.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const throttler_guard_1 = require("../common/guards/throttler.guard");
let TemplateController = class TemplateController {
    constructor(templateService, prismaService, i18nService) {
        this.templateService = templateService;
        this.prismaService = prismaService;
        this.i18nService = i18nService;
    }
    async validateTemplate(validateDto) {
        const validation = await this.templateService.validateTemplate(validateDto.template);
        return new base_response_dto_1.BaseResponseDto(validation, validation.isValid ? 'Template is valid' : 'Template validation failed');
    }
    async resolveTemplate(resolveDto, req) {
        const startTime = Date.now();
        const userId = req.user?.id || 'anonymous';
        const userRole = req.user?.role || role_enum_1.Role.VIEWER;
        const context = await this.buildTemplateContext(resolveDto.applicationId, resolveDto.planId, userId, userRole, req);
        const content = await this.templateService.resolveTemplate(resolveDto.template, context, {
            timeout: resolveDto.timeout,
            strictMode: resolveDto.strictMode,
            sanitizeOutput: resolveDto.sanitizeOutput,
        });
        const renderTime = Date.now() - startTime;
        const placeholders = this.templateService.extractPlaceholders(resolveDto.template);
        const response = {
            content,
            metadata: {
                renderTime,
                placeholderCount: placeholders.length,
                templateSize: resolveDto.template.length,
            },
        };
        return new base_response_dto_1.BaseResponseDto(response, 'Template resolved successfully');
    }
    async extractPlaceholders(validateDto) {
        const placeholders = this.templateService.extractPlaceholders(validateDto.template);
        return new base_response_dto_1.BaseResponseDto({ placeholders }, `Extracted ${placeholders.length} placeholders`);
    }
    async buildTemplateContext(applicationId, planId, userId, userRole, req) {
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
        if (userRole !== 'ADMIN' && application.userId !== userId) {
            throw new Error('Access denied to this application');
        }
        const context = {
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
};
exports.TemplateController = TemplateController;
__decorate([
    (0, common_1.Post)('validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Validate template syntax and security' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Template validation result',
        type: dto_1.TemplateValidationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid template' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ValidateTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "validateTemplate", null);
__decorate([
    (0, common_1.Post)('resolve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve template with application data' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Template resolved successfully',
        type: dto_1.ResolvedTemplateResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Template resolution failed' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Application not found' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.VIEWER, role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ResolveTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "resolveTemplate", null);
__decorate([
    (0, common_1.Post)('placeholders'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Extract placeholders from template' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Placeholders extracted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid template' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ValidateTemplateDto]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "extractPlaceholders", null);
exports.TemplateController = TemplateController = __decorate([
    (0, swagger_1.ApiTags)('template'),
    (0, common_1.Controller)('template'),
    (0, common_1.UseGuards)(throttler_guard_1.CustomThrottlerGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [template_service_1.TemplateService,
        prisma_service_1.PrismaService,
        i18n_service_1.I18nService])
], TemplateController);
//# sourceMappingURL=template.controller.js.map