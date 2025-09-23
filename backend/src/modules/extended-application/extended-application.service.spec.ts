import { Test, TestingModule } from '@nestjs/testing';
import { ExtendedApplicationService } from './extended-application.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Priority, KpiCategory, ChartType, TaskType } from './dto';

describe('ExtendedApplicationService', () => {
  let service: ExtendedApplicationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    application: {
      findUnique: jest.fn(),
    },
    purposeBackground: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    detailedPlan: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    kpiTarget: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    ganttTask: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtendedApplicationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExtendedApplicationService>(ExtendedApplicationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPurposeBackground', () => {
    it('should create a purpose background successfully', async () => {
      const dto = {
        applicationId: 'app-123',
        currentIssues: [
          { category: 'efficiency', description: 'Manual process', impact: 'High' },
        ],
        painPoints: 'Time consuming tasks',
        solution: 'Automation',
        approach: 'Phased implementation',
      };

      const mockApplication = { id: 'app-123' };
      const mockCreated = { id: 'pb-123', ...dto };

      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.purposeBackground.create.mockResolvedValue(mockCreated);

      const result = await service.createPurposeBackground(dto);

      expect(result).toEqual(mockCreated);
      expect(mockPrismaService.application.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-123' },
      });
      expect(mockPrismaService.purposeBackground.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationId: dto.applicationId,
          currentIssues: dto.currentIssues,
        }),
      });
    });

    it('should throw NotFoundException if application not found', async () => {
      const dto = {
        applicationId: 'non-existent',
        currentIssues: [],
        painPoints: 'Test',
        solution: 'Test',
        approach: 'Test',
      };

      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.createPurposeBackground(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createDetailedPlans', () => {
    it('should create detailed plans successfully', async () => {
      const dto = {
        plans: [
          {
            applicationId: 'app-123',
            what: 'Implement system',
            why: 'Improve efficiency',
            who: 'IT team',
            where: 'HQ',
            when: '2024 Q1',
            how: 'Agile methodology',
            priority: Priority.HIGH,
            category: 'Technology',
            expectedResult: 'Increased productivity',
            orderIndex: 0,
          },
        ],
      };

      const mockApplication = { id: 'app-123' };
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.detailedPlan.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.detailedPlan.createMany.mockResolvedValue({ count: 1 });

      const result = await service.createDetailedPlans(dto);

      expect(result).toEqual({ count: 1 });
      expect(mockPrismaService.detailedPlan.deleteMany).toHaveBeenCalledWith({
        where: { applicationId: 'app-123' },
      });
      expect(mockPrismaService.detailedPlan.createMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no plans provided', async () => {
      const dto = { plans: [] };

      await expect(service.createDetailedPlans(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getKpiTargets', () => {
    it('should return KPI targets with growth rates', async () => {
      const mockTargets = [
        {
          id: 'kpi-1',
          applicationId: 'app-123',
          category: KpiCategory.SALES,
          metric: 'Monthly Revenue',
          unit: 'JPY',
          currentValue: 1000000,
          year1Target: 1200000,
          year2Target: 1500000,
          year3Target: 2000000,
          chartType: ChartType.LINE,
          displayOrder: 0,
        },
      ];

      mockPrismaService.kpiTarget.findMany.mockResolvedValue(mockTargets);

      const result = await service.getKpiTargets('app-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('growthRateYear1');
      expect(result[0].growthRateYear1).toBe(20); // (1200000 - 1000000) / 1000000 * 100
    });
  });

  describe('getGanttTasks', () => {
    it('should return gantt tasks with delay calculation', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const mockTasks = [
        {
          id: 'task-1',
          applicationId: 'app-123',
          taskName: 'Development',
          taskType: TaskType.TASK,
          startDate: pastDate,
          endDate: pastDate,
          duration: 30,
          progress: 50,
          assignee: 'John Doe',
          milestone: false,
          critical: false,
          orderIndex: 0,
        },
      ];

      mockPrismaService.ganttTask.findMany.mockResolvedValue(mockTasks);

      const result = await service.getGanttTasks('app-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('delayDays');
      expect(result[0]).toHaveProperty('estimatedCompletionDate');
      expect(result[0].delayDays).toBeGreaterThan(0); // Task is delayed
    });
  });
});