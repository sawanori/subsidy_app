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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/audit/audit.service");
const i18n_service_1 = require("../common/i18n/i18n.service");
const template_service_1 = require("../template/template.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const prisma_1 = require("@generated/prisma");
let ApplicationsService = class ApplicationsService {
    constructor(prisma, auditService, i18nService, templateService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.i18nService = i18nService;
        this.templateService = templateService;
    }
    async create(userId, createApplicationDto, req) {
        const tempApplicant = await this.prisma.applicant.create({
            data: {
                companyName: 'Demo Company',
                representativeName: 'Demo User',
                phoneNumber: '000-0000-0000',
                email: 'demo@example.com',
                address: 'Demo Address',
            },
        });
        const application = await this.prisma.application.create({
            data: {
                title: createApplicationDto.title,
                locale: createApplicationDto.locale || 'ja',
                status: createApplicationDto.status || 'DRAFT',
                user: { connect: { id: userId } },
                applicant: { connect: { id: tempApplicant.id } },
            },
            include: {
                user: true,
                applicant: true,
            },
        });
        await this.auditService.logCreate(userId, 'application', application.id, createApplicationDto, req);
        return application;
    }
    async findAll(userId, pagination, userRole = 'VIEWER') {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;
        const whereClause = userRole === 'ADMIN' ? {} : { userId };
        const [applications, total] = await Promise.all([
            this.prisma.application.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, email: true, role: true }
                    },
                    applicant: {
                        select: {
                            id: true,
                            companyName: true,
                        }
                    },
                    _count: {
                        select: { kpis: true, evidences: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.application.count({ where: whereClause }),
        ]);
        const meta = new pagination_dto_1.PaginationMetaDto(page, limit, total);
        return { data: applications, meta };
    }
    async findOne(id, userId, userRole = 'VIEWER', req) {
        const application = await this.prisma.application.findUnique({
            where: { id },
            include: {
                user: true,
                applicant: true,
                budget: true,
                kpis: true,
                plan: {
                    include: {
                        actions: true,
                        schedules: true,
                        organization: {
                            include: { members: true }
                        },
                        risks: true,
                    }
                },
                evidences: true,
                competitors: true,
            },
        });
        if (!application) {
            throw new common_1.NotFoundException(`Application with ID ${id} not found`);
        }
        if (userRole !== 'ADMIN' && application.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied to this application');
        }
        await this.auditService.logAccess(userId, 'application', id, req);
        return application;
    }
    async update(id, userId, updateApplicationDto, userRole = 'VIEWER', req) {
        const existing = await this.findOne(id, userId, userRole);
        if (userRole === 'VIEWER') {
            throw new common_1.ForbiddenException('VIEWER role cannot update applications');
        }
        if (userRole === 'EDITOR' && existing.userId !== userId) {
            throw new common_1.ForbiddenException('EDITOR can only update own applications');
        }
        if (existing.status === prisma_1.ApplicationStatus.SUBMITTED &&
            updateApplicationDto.status &&
            userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException('Cannot modify submitted application');
        }
        const updated = await this.prisma.application.update({
            where: { id },
            data: updateApplicationDto,
            include: {
                user: true,
                applicant: true,
            },
        });
        await this.auditService.logUpdate(userId, 'application', id, updateApplicationDto, req);
        return updated;
    }
    async remove(id, userId, userRole = 'ADMIN', req) {
        if (userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only administrators can delete applications');
        }
        const application = await this.findOne(id, userId, userRole);
        await this.prisma.application.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await this.auditService.logDelete(userId, 'application', id, req);
    }
    async getStatistics(userId, userRole = 'VIEWER') {
        const whereClause = userRole === 'ADMIN' ? {} : { userId };
        const stats = await this.prisma.application.groupBy({
            by: ['status'],
            where: {
                ...whereClause,
                deletedAt: null,
            },
            _count: { status: true },
        });
        const total = await this.prisma.application.count({
            where: { ...whereClause, deletedAt: null },
        });
        return { stats, total };
    }
    async generateApplication(id, userId, userRole = 'VIEWER', generateDto, req) {
        const application = await this.findOne(id, userId, userRole, req);
        const jobId = `job_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const generationResponse = {
            jobId,
            status: 'queued',
            createdAt: new Date(),
        };
        await this.auditService.logAccess(userId, 'application_generation', id, req);
        setTimeout(() => {
            generationResponse.status = 'completed';
            generationResponse.downloadUrl = `/api/files/download/${jobId}.${generateDto.format}`;
        }, 2000);
        return generationResponse;
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        i18n_service_1.I18nService,
        template_service_1.TemplateService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map