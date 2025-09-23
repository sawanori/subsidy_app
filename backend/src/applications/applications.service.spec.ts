import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { I18nService } from '../common/i18n/i18n.service';
import { CreateApplicationDto, GenerateApplicationDto } from './dto';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prismaService: any;
  let auditService: jest.Mocked<AuditService>;

  const mockApplication = {
    id: 'app-1',
    title: 'Test Application',
    status: 'DRAFT' as const,
    userId: 'user-1',
    applicantId: 'applicant-1',
    locale: 'ja',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    submittedAt: null,
    user: { id: 'user-1', email: 'test@example.com', role: 'EDITOR' as const },
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    prismaService = module.get(PrismaService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateApplicationDto = {
      title: 'New Application',
    };

    it('should create an application successfully', async () => {
      prismaService.applicant.create.mockResolvedValue({ id: 'applicant-1' });
      prismaService.application.create.mockResolvedValue(mockApplication as any);

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
      expect(auditService.logCreate).toHaveBeenCalledWith(
        'user-1',
        'application',
        mockApplication.id,
        createDto,
        undefined
      );
      expect(result).toEqual(mockApplication);
    });
  });

  describe('findOne', () => {
    it('should return application when user has access', async () => {
      prismaService.application.findUnique.mockResolvedValue(mockApplication as any);

      const result = await service.findOne('app-1', 'user-1', 'EDITOR');

      expect(prismaService.application.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        include: expect.any(Object),
      });
      expect(auditService.logAccess).toHaveBeenCalledWith(
        'user-1',
        'application',
        'app-1',
        undefined
      );
      expect(result).toEqual(mockApplication);
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-1', 'EDITOR'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own application', async () => {
      const otherUserApp = { ...mockApplication, userId: 'user-2' };
      prismaService.application.findUnique.mockResolvedValue(otherUserApp as any);

      await expect(service.findOne('app-1', 'user-1', 'VIEWER'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to access any application', async () => {
      const otherUserApp = { ...mockApplication, userId: 'user-2' };
      prismaService.application.findUnique.mockResolvedValue(otherUserApp as any);

      const result = await service.findOne('app-1', 'user-1', 'ADMIN');

      expect(result).toEqual(otherUserApp);
      expect(auditService.logAccess).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = { title: 'Updated Application' };

    it('should update application successfully', async () => {
      prismaService.application.findUnique.mockResolvedValue(mockApplication as any);
      const updatedApp = { ...mockApplication, ...updateDto };
      prismaService.application.update.mockResolvedValue(updatedApp as any);

      const result = await service.update('app-1', 'user-1', updateDto, 'EDITOR');

      expect(prismaService.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: updateDto,
        include: {
          user: true,
          applicant: true,
        },
      });
      expect(auditService.logUpdate).toHaveBeenCalledWith(
        'user-1',
        'application',
        'app-1',
        updateDto,
        undefined
      );
      expect(result).toEqual(updatedApp);
    });

    it('should throw ForbiddenException when VIEWER tries to update', async () => {
      prismaService.application.findUnique.mockResolvedValue(mockApplication as any);

      await expect(service.update('app-1', 'user-1', updateDto, 'VIEWER'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete application for ADMIN', async () => {
      prismaService.application.findUnique.mockResolvedValue(mockApplication as any);
      prismaService.application.update.mockResolvedValue(mockApplication as any);

      await service.remove('app-1', 'user-1', 'ADMIN');

      expect(prismaService.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(auditService.logDelete).toHaveBeenCalledWith(
        'user-1',
        'application',
        'app-1',
        undefined
      );
    });

    it('should throw ForbiddenException for non-ADMIN users', async () => {
      await expect(service.remove('app-1', 'user-1', 'EDITOR'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStatistics', () => {
    it('should return application statistics', async () => {
      const mockStats = [
        { status: 'DRAFT', _count: { status: 3 } },
        { status: 'SUBMITTED', _count: { status: 2 } },
      ];
      prismaService.application.groupBy.mockResolvedValue(mockStats as any);
      prismaService.application.count.mockResolvedValue(5);

      const result = await service.getStatistics('user-1', 'VIEWER');

      expect(result).toEqual({ stats: mockStats, total: 5 });
    });
  });

  describe('generateApplication', () => {
    const generateDto: GenerateApplicationDto = {
      format: 'pdf' as any,
      template: 'standard' as any,
      locale: 'ja',
      includeSignature: false,
    };

    it('should generate application document successfully', async () => {
      prismaService.application.findUnique.mockResolvedValue(mockApplication as any);

      const result = await service.generateApplication(
        'app-1', 
        'user-1', 
        'VIEWER', 
        generateDto
      );

      expect(result.jobId).toBeDefined();
      expect(result.status).toBe('queued');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(auditService.logAccess).toHaveBeenCalledWith(
        'user-1',
        'application_generation',
        'app-1',
        undefined
      );
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.generateApplication('nonexistent', 'user-1', 'VIEWER', generateDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should allow ADMIN to generate any application', async () => {
      const otherUserApp = { ...mockApplication, userId: 'user-2' };
      prismaService.application.findUnique.mockResolvedValue(otherUserApp as any);

      const result = await service.generateApplication(
        'app-1', 
        'user-1', 
        'ADMIN', 
        generateDto
      );

      expect(result).toBeDefined();
      expect(result.jobId).toContain('job_app-1_');
    });
  });
});