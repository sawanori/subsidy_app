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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const i18n_service_1 = require("../common/i18n/i18n.service");
let PlansService = class PlansService {
    constructor(prisma, i18nService) {
        this.prisma = prisma;
        this.i18nService = i18nService;
    }
    async create(userId, createPlanDto, userRole = 'EDITOR') {
        const application = await this.prisma.application.findUnique({
            where: { id: createPlanDto.applicationId },
            include: { user: true }
        });
        if (!application) {
            throw new common_1.NotFoundException(`Application with ID ${createPlanDto.applicationId} not found`);
        }
        if (userRole !== 'ADMIN' && application.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied to this application');
        }
        const { actions, kpis, ...planData } = createPlanDto;
        const plan = await this.prisma.plan.create({
            data: {
                ...planData,
                actions: {
                    create: actions.map(action => ({
                        name: action.name,
                        purpose: action.purpose,
                        deliverable: action.deliverable,
                        evidence: action.evidence,
                        assignee: action.assignee,
                        location: action.location,
                        method: action.method,
                        status: 'PLANNED',
                    }))
                },
            },
            include: {
                actions: true,
                schedules: true,
                organization: {
                    include: { members: true }
                },
                risks: true,
                application: true,
            },
        });
        if (kpis && kpis.length > 0) {
            await this.prisma.kPI.createMany({
                data: kpis.map(kpi => ({
                    ...kpi,
                    applicationId: createPlanDto.applicationId,
                }))
            });
        }
        return plan;
    }
    async findAll(userId, userRole = 'VIEWER') {
        const whereClause = userRole === 'ADMIN'
            ? {}
            : { application: { userId } };
        const plans = await this.prisma.plan.findMany({
            where: whereClause,
            include: {
                application: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        user: {
                            select: { id: true, email: true }
                        }
                    }
                },
                actions: true,
                schedules: true,
                organization: {
                    include: { members: true }
                },
                risks: true,
                _count: {
                    select: { actions: true, schedules: true, risks: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        return plans;
    }
    async findOne(id, userId, userRole = 'VIEWER') {
        const plan = await this.prisma.plan.findUnique({
            where: { id },
            include: {
                application: {
                    include: {
                        user: true,
                        kpis: true,
                    }
                },
                actions: {
                    orderBy: { createdAt: 'asc' }
                },
                schedules: {
                    orderBy: { startDate: 'asc' }
                },
                organization: {
                    include: { members: true }
                },
                risks: {
                    orderBy: { createdAt: 'desc' }
                },
            },
        });
        if (!plan) {
            throw new common_1.NotFoundException(`Plan with ID ${id} not found`);
        }
        if (userRole !== 'ADMIN' && plan.application.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied to this plan');
        }
        return plan;
    }
    async update(id, userId, updatePlanDto, userRole = 'EDITOR') {
        const existing = await this.findOne(id, userId, userRole);
        if (userRole === 'VIEWER') {
            throw new common_1.ForbiddenException('Insufficient permissions to update this plan');
        }
        const { actions, kpis, ...planData } = updatePlanDto;
        const updated = await this.prisma.plan.update({
            where: { id },
            data: planData,
            include: {
                actions: true,
                schedules: true,
                organization: {
                    include: { members: true }
                },
                risks: true,
                application: true,
            },
        });
        return updated;
    }
    async remove(id, userId, userRole = 'ADMIN') {
        if (userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only administrators can delete plans');
        }
        const plan = await this.findOne(id, userId, userRole);
        await this.prisma.plan.delete({
            where: { id },
        });
    }
    async addAction(planId, userId, actionData, userRole = 'EDITOR') {
        const plan = await this.findOne(planId, userId, userRole);
        const action = await this.prisma.action.create({
            data: {
                ...actionData,
                planId,
                status: 'PLANNED',
            },
        });
        return action;
    }
    async updateAction(actionId, userId, actionData, userRole = 'EDITOR') {
        const action = await this.prisma.action.findUnique({
            where: { id: actionId },
            include: { plan: { include: { application: true } } }
        });
        if (!action) {
            throw new common_1.NotFoundException(`Action with ID ${actionId} not found`);
        }
        if (userRole !== 'ADMIN' && action.plan.application.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied to this action');
        }
        return await this.prisma.action.update({
            where: { id: actionId },
            data: actionData,
        });
    }
    async addSchedule(planId, userId, scheduleData, userRole = 'EDITOR') {
        const plan = await this.findOne(planId, userId, userRole);
        const schedule = await this.prisma.schedule.create({
            data: {
                ...scheduleData,
                planId,
            },
        });
        return schedule;
    }
    async addRisk(planId, userId, riskData, userRole = 'EDITOR') {
        const plan = await this.findOne(planId, userId, userRole);
        const risk = await this.prisma.risk.create({
            data: {
                ...riskData,
                planId,
                status: 'IDENTIFIED',
            },
        });
        return risk;
    }
    async updateOrganization(planId, userId, orgData, userRole = 'EDITOR') {
        const plan = await this.findOne(planId, userId, userRole);
        return await this.prisma.organization.upsert({
            where: { planId },
            create: {
                ...orgData,
                planId,
            },
            update: orgData,
            include: { members: true },
        });
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        i18n_service_1.I18nService])
], PlansService);
//# sourceMappingURL=plans.service.js.map