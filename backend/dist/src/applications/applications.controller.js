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
exports.ApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const applications_service_1 = require("./applications.service");
const dto_1 = require("./dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const base_response_dto_1 = require("../common/dto/base-response.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const throttler_guard_1 = require("../common/guards/throttler.guard");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
let ApplicationsController = class ApplicationsController {
    constructor(applicationsService) {
        this.applicationsService = applicationsService;
    }
    async create(createApplicationDto, req) {
        const application = await this.applicationsService.create(req.user.id, createApplicationDto, req);
        return new base_response_dto_1.BaseResponseDto(application, 'Application created successfully');
    }
    async findAll(pagination, req) {
        const result = await this.applicationsService.findAll(req.user.id, pagination, req.user.role || role_enum_1.Role.VIEWER);
        return new base_response_dto_1.BaseResponseDto(result, 'Applications retrieved successfully');
    }
    async getStatistics(req) {
        const stats = await this.applicationsService.getStatistics(req.user.id, req.user.role || role_enum_1.Role.VIEWER);
        return new base_response_dto_1.BaseResponseDto(stats, 'Statistics retrieved successfully');
    }
    async findOne(id, req) {
        const application = await this.applicationsService.findOne(id, req.user.id, req.user.role || role_enum_1.Role.VIEWER, req);
        return new base_response_dto_1.BaseResponseDto(application, 'Application retrieved successfully');
    }
    async update(id, updateApplicationDto, req) {
        const application = await this.applicationsService.update(id, req.user.id, updateApplicationDto, req.user.role || role_enum_1.Role.EDITOR, req);
        return new base_response_dto_1.BaseResponseDto(application, 'Application updated successfully');
    }
    async remove(id, req) {
        await this.applicationsService.remove(id, req.user.id, req.user.role || role_enum_1.Role.ADMIN, req);
        return new base_response_dto_1.BaseResponseDto(null, 'Application deleted successfully');
    }
    async generateApplication(id, generateDto, req) {
        const generationResult = await this.applicationsService.generateApplication(id, req.user.id, req.user.role || role_enum_1.Role.VIEWER, generateDto, req);
        return new base_response_dto_1.BaseResponseDto(generationResult, 'Generation job created successfully');
    }
};
exports.ApplicationsController = ApplicationsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new application' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Application created successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all applications with pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Applications retrieved successfully',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get application statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistics retrieved successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get application by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Application retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Application not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update application' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Application updated successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Application not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete application' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Application deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Application not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/generate'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate application document' }),
    (0, swagger_1.ApiResponse)({
        status: 202,
        description: 'Generation job created successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Application not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.VIEWER, role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.GenerateApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "generateApplication", null);
exports.ApplicationsController = ApplicationsController = __decorate([
    (0, swagger_1.ApiTags)('applications'),
    (0, common_1.Controller)('applications'),
    (0, common_1.UseGuards)(throttler_guard_1.CustomThrottlerGuard, supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [applications_service_1.ApplicationsService])
], ApplicationsController);
//# sourceMappingURL=applications.controller.js.map