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
exports.PlansController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const plans_service_1 = require("./plans.service");
const dto_1 = require("./dto");
const base_response_dto_1 = require("../common/dto/base-response.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const throttler_guard_1 = require("../common/guards/throttler.guard");
let PlansController = class PlansController {
    constructor(plansService) {
        this.plansService = plansService;
    }
    async create(createPlanDto, req) {
        const plan = await this.plansService.create(req.user?.id || 'anonymous', createPlanDto, req.user?.role || role_enum_1.Role.EDITOR);
        return new base_response_dto_1.BaseResponseDto(plan, 'Plan created successfully');
    }
    async findAll(req) {
        const plans = await this.plansService.findAll(req.user?.id || 'anonymous', req.user?.role || role_enum_1.Role.VIEWER);
        return new base_response_dto_1.BaseResponseDto(plans, 'Plans retrieved successfully');
    }
    async findOne(id, req) {
        const plan = await this.plansService.findOne(id, req.user?.id || 'anonymous', req.user?.role || role_enum_1.Role.VIEWER);
        return new base_response_dto_1.BaseResponseDto(plan, 'Plan retrieved successfully');
    }
    async update(id, updatePlanDto, req) {
        const plan = await this.plansService.update(id, req.user?.id || 'anonymous', updatePlanDto, req.user?.role || role_enum_1.Role.EDITOR);
        return new base_response_dto_1.BaseResponseDto(plan, 'Plan updated successfully');
    }
    async remove(id, req) {
        await this.plansService.remove(id, req.user?.id || 'anonymous', req.user?.role || role_enum_1.Role.ADMIN);
        return new base_response_dto_1.BaseResponseDto(null, 'Plan deleted successfully');
    }
    async addAction(planId, actionData, req) {
        const action = await this.plansService.addAction(planId, req.user?.id || 'anonymous', actionData, req.user?.role || role_enum_1.Role.EDITOR);
        return new base_response_dto_1.BaseResponseDto(action, 'Action added successfully');
    }
    async updateAction(actionId, actionData, req) {
        const action = await this.plansService.updateAction(actionId, req.user?.id || 'anonymous', actionData, req.user?.role || role_enum_1.Role.EDITOR);
        return new base_response_dto_1.BaseResponseDto(action, 'Action updated successfully');
    }
    async addSchedule(planId, scheduleData, req) {
        const schedule = await this.plansService.addSchedule(planId, req.user?.id || 'anonymous', scheduleData, req.user?.role || role_enum_1.Role.EDITOR);
        return new base_response_dto_1.BaseResponseDto(schedule, 'Schedule added successfully');
    }
    async addRisk(planId, riskData, req) {
        const risk = await this.plansService.addRisk(planId, req.user?.id || 'anonymous', riskData, req.user?.role || role_enum_1.Role.EDITOR);
        return new base_response_dto_1.BaseResponseDto(risk, 'Risk added successfully');
    }
    async updateOrganization(planId, orgData, req) {
        const organization = await this.plansService.updateOrganization(planId, req.user?.id || 'anonymous', orgData, req.user?.role || role_enum_1.Role.EDITOR);
        return new base_response_dto_1.BaseResponseDto(organization, 'Organization updated successfully');
    }
};
exports.PlansController = PlansController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new plan' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Plan created successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePlanDto, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all plans' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plans retrieved successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get plan by ID with nested resources' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plan retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update plan' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plan updated successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePlanDto, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete plan' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plan deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/actions'),
    (0, swagger_1.ApiOperation)({ summary: 'Add action to plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Action added successfully' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "addAction", null);
__decorate([
    (0, common_1.Patch)('actions/:actionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update action' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Action updated successfully' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('actionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "updateAction", null);
__decorate([
    (0, common_1.Post)(':id/schedules'),
    (0, swagger_1.ApiOperation)({ summary: 'Add schedule to plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Schedule added successfully' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "addSchedule", null);
__decorate([
    (0, common_1.Post)(':id/risks'),
    (0, swagger_1.ApiOperation)({ summary: 'Add risk to plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Risk added successfully' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "addRisk", null);
__decorate([
    (0, common_1.Put)(':id/organization'),
    (0, swagger_1.ApiOperation)({ summary: 'Update organization structure' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Organization updated successfully' }),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EDITOR, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "updateOrganization", null);
exports.PlansController = PlansController = __decorate([
    (0, swagger_1.ApiTags)('plans'),
    (0, common_1.Controller)('plans'),
    (0, common_1.UseGuards)(throttler_guard_1.CustomThrottlerGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], PlansController);
//# sourceMappingURL=plans.controller.js.map