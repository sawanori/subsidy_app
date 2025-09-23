"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const applications_service_1 = require("./applications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/audit/audit.service");
const i18n_service_1 = require("../common/i18n/i18n.service");
describe('ApplicationsService', () => {
    let service;
    let prismaService;
    let auditService;
    const mockApplication = {
        id: 'app-1',
        title: 'Test Application',
        status: 'DRAFT',
        userId: 'user-1',
        applicantId: 'applicant-1',
        locale: 'ja',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        submittedAt: null,
        user: { id: 'user-1', email: 'test@example.com', role: 'EDITOR' },
        applicant: { id: 'applicant-1', companyName: 'Test Corp' },
    };
    beforeEach(async () => {
        const mockPrismaService = {
            applicant: {
                create: jest.fn(),
            },
            application: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                count: jest.fn(),
                groupBy: jest.fn(),
            },
        };
        const mockAuditService = {
            logCreate: jest.fn(),
            logUpdate: jest.fn(),
            logDelete: jest.fn(),
            logAccess: jest.fn(),
        };
        const mockI18nService = {
            translate: jest.fn((key) => key),
            formatDate: jest.fn((date) => date),
            formatDateTime: jest.fn((date) => date),
            formatCurrency: jest.fn((amount) => `¥${amount}`),
            formatNumber: jest.fn((number) => number.toString()),
            toUtc: jest.fn((date) => date),
            detectLocale: jest.fn(() => 'ja'),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                applications_service_1.ApplicationsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
                { provide: i18n_service_1.I18nService, useValue: mockI18nService },
            ],
        }).compile();
        service = module.get(applications_service_1.ApplicationsService);
        prismaService = module.get(prisma_service_1.PrismaService);
        auditService = module.get(audit_service_1.AuditService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        const createDto = {
            title: 'New Application',
        };
        it('should create an application successfully', async () => {
            prismaService.applicant.create.mockResolvedValue({ id: 'applicant-1' });
            prismaService.application.create.mockResolvedValue(mockApplication);
            const result = await service.create('user-1', createDto);
            expect(prismaService.applicant.create).toHaveBeenCalled();
            expect(prismaService.application.create).toHaveBeenCalledWith({
                data: {
                    title: createDto.title,
                    locale: 'ja',
                    status: 'DRAFT',
                    user: { connect: { id: 'user-1' } },
                    applicant: { connect: { id: 'applicant-1' } },
                },
                include: {
                    user: true,
                    applicant: true,
                },
            });
            expect(auditService.logCreate).toHaveBeenCalledWith('user-1', 'application', mockApplication.id, createDto, undefined);
            expect(result).toEqual(mockApplication);
        });
    });
    describe('findOne', () => {
        it('should return application when user has access', async () => {
            prismaService.application.findUnique.mockResolvedValue(mockApplication);
            const result = await service.findOne('app-1', 'user-1', 'EDITOR');
            expect(prismaService.application.findUnique).toHaveBeenCalledWith({
                where: { id: 'app-1' },
                include: expect.any(Object),
            });
            expect(auditService.logAccess).toHaveBeenCalledWith('user-1', 'application', 'app-1', undefined);
            expect(result).toEqual(mockApplication);
        });
        it('should throw NotFoundException when application does not exist', async () => {
            prismaService.application.findUnique.mockResolvedValue(null);
            await expect(service.findOne('nonexistent', 'user-1', 'EDITOR'))
                .rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw ForbiddenException when user does not own application', async () => {
            const otherUserApp = { ...mockApplication, userId: 'user-2' };
            prismaService.application.findUnique.mockResolvedValue(otherUserApp);
            await expect(service.findOne('app-1', 'user-1', 'VIEWER'))
                .rejects.toThrow(common_1.ForbiddenException);
        });
        it('should allow admin to access any application', async () => {
            const otherUserApp = { ...mockApplication, userId: 'user-2' };
            prismaService.application.findUnique.mockResolvedValue(otherUserApp);
            const result = await service.findOne('app-1', 'user-1', 'ADMIN');
            expect(result).toEqual(otherUserApp);
            expect(auditService.logAccess).toHaveBeenCalled();
        });
    });
    describe('update', () => {
        const updateDto = { title: 'Updated Application' };
        it('should update application successfully', async () => {
            prismaService.application.findUnique.mockResolvedValue(mockApplication);
            const updatedApp = { ...mockApplication, ...updateDto };
            prismaService.application.update.mockResolvedValue(updatedApp);
            const result = await service.update('app-1', 'user-1', updateDto, 'EDITOR');
            expect(prismaService.application.update).toHaveBeenCalledWith({
                where: { id: 'app-1' },
                data: updateDto,
                include: {
                    user: true,
                    applicant: true,
                },
            });
            expect(auditService.logUpdate).toHaveBeenCalledWith('user-1', 'application', 'app-1', updateDto, undefined);
            expect(result).toEqual(updatedApp);
        });
        it('should throw ForbiddenException when VIEWER tries to update', async () => {
            prismaService.application.findUnique.mockResolvedValue(mockApplication);
            await expect(service.update('app-1', 'user-1', updateDto, 'VIEWER'))
                .rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('remove', () => {
        it('should soft delete application for ADMIN', async () => {
            prismaService.application.findUnique.mockResolvedValue(mockApplication);
            prismaService.application.update.mockResolvedValue(mockApplication);
            await service.remove('app-1', 'user-1', 'ADMIN');
            expect(prismaService.application.update).toHaveBeenCalledWith({
                where: { id: 'app-1' },
                data: { deletedAt: expect.any(Date) },
            });
            expect(auditService.logDelete).toHaveBeenCalledWith('user-1', 'application', 'app-1', undefined);
        });
        it('should throw ForbiddenException for non-ADMIN users', async () => {
            await expect(service.remove('app-1', 'user-1', 'EDITOR'))
                .rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('getStatistics', () => {
        it('should return application statistics', async () => {
            const mockStats = [
                { status: 'DRAFT', _count: { status: 3 } },
                { status: 'SUBMITTED', _count: { status: 2 } },
            ];
            prismaService.application.groupBy.mockResolvedValue(mockStats);
            prismaService.application.count.mockResolvedValue(5);
            const result = await service.getStatistics('user-1', 'VIEWER');
            expect(result).toEqual({ stats: mockStats, total: 5 });
        });
    });
    describe('generateApplication', () => {
        const generateDto = {
            format: 'pdf',
            template: 'standard',
            locale: 'ja',
            includeSignature: false,
        };
        it('should generate application document successfully', async () => {
            prismaService.application.findUnique.mockResolvedValue(mockApplication);
            const result = await service.generateApplication('app-1', 'user-1', 'VIEWER', generateDto);
            expect(result.jobId).toBeDefined();
            expect(result.status).toBe('queued');
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(auditService.logAccess).toHaveBeenCalledWith('user-1', 'application_generation', 'app-1', undefined);
        });
        it('should throw NotFoundException when application does not exist', async () => {
            prismaService.application.findUnique.mockResolvedValue(null);
            await expect(service.generateApplication('nonexistent', 'user-1', 'VIEWER', generateDto))
                .rejects.toThrow(common_1.NotFoundException);
        });
        it('should allow ADMIN to generate any application', async () => {
            const otherUserApp = { ...mockApplication, userId: 'user-2' };
            prismaService.application.findUnique.mockResolvedValue(otherUserApp);
            const result = await service.generateApplication('app-1', 'user-1', 'ADMIN', generateDto);
            expect(result).toBeDefined();
            expect(result.jobId).toContain('job_app-1_');
        });
    });
});
//# sourceMappingURL=applications.service.spec.js.map