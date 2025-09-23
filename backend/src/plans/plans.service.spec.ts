import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../common/i18n/i18n.service';
import { CreatePlanDto } from './dto';

describe('PlansService', () => {
  let service: PlansService;
  let prismaService: any;

  const mockApplication = {
    id: 'app-1',
    userId: 'user-1',
    title: 'Test Application',
    user: { id: 'user-1', email: 'test@example.com' },
  };

  const mockPlan = {
    id: 'plan-1',
    applicationId: 'app-1',
    background: 'Test background',
    solution: 'Test solution',
    expectedOutcome: 'Test outcome',
    application: mockApplication,
    actions: [],
    schedules: [],
    organization: null,
    risks: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      application: {
        findUnique: jest.fn(),
      },
      plan: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      kPI: {
        createMany: jest.fn(),
      },
      action: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      schedule: {
        create: jest.fn(),
      },
      risk: {
        create: jest.fn(),
      },
      organization: {
        upsert: jest.fn(),
      },
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
        PlansService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreatePlanDto = {
      name: 'Test Plan',
      background: 'Test background',
      solution: 'Test solution',
      expectedOutcome: 'Test outcome',
      applicationId: 'app-1',
      actions: [{
        name: 'Test Action',
        purpose: 'Test action purpose',
        evidence: 'Test evidence',
        assignee: 'John Doe',
        deliverable: 'Test deliverable',
      }],
      kpis: [{
        name: 'Test KPI',
        unit: 'count',
        targetValue: 100,
        rationale: 'Test rationale',
        measurementMethod: 'Test measurement',
      }],
    };

    it('should create a plan successfully', async () => {
      prismaService.application.findUnique.mockResolvedValue(mockApplication as any);
      prismaService.plan.create.mockResolvedValue(mockPlan as any);
      prismaService.kPI.createMany.mockResolvedValue({ count: 1 });

      const result = await service.create('user-1', createDto, 'EDITOR');

      expect(prismaService.application.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        include: { user: true },
      });
      expect(prismaService.plan.create).toHaveBeenCalled();
      expect(prismaService.kPI.createMany).toHaveBeenCalled();
      expect(result).toEqual(mockPlan);
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', createDto, 'EDITOR'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own application', async () => {
      const otherUserApp = { ...mockApplication, userId: 'user-2' };
      prismaService.application.findUnique.mockResolvedValue(otherUserApp as any);

      await expect(service.create('user-1', createDto, 'EDITOR'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return plan when user has access', async () => {
      prismaService.plan.findUnique.mockResolvedValue(mockPlan as any);

      const result = await service.findOne('plan-1', 'user-1', 'VIEWER');

      expect(prismaService.plan.findUnique).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockPlan);
    });

    it('should throw NotFoundException when plan does not exist', async () => {
      prismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-1', 'VIEWER'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('addAction', () => {
    const actionData = {
      name: 'New Action',
      purpose: 'Test purpose',
      deliverable: 'Test deliverable',
      evidence: 'Test evidence',
      assignee: 'John Doe',
    };

    it('should add action to plan successfully', async () => {
      prismaService.plan.findUnique.mockResolvedValue(mockPlan as any);
      const newAction = { id: 'action-1', ...actionData, planId: 'plan-1' };
      prismaService.action.create.mockResolvedValue(newAction as any);

      const result = await service.addAction('plan-1', 'user-1', actionData, 'EDITOR');

      expect(prismaService.action.create).toHaveBeenCalledWith({
        data: {
          ...actionData,
          planId: 'plan-1',
          status: 'PLANNED',
        },
      });
      expect(result).toEqual(newAction);
    });
  });

  describe('updateAction', () => {
    const actionData = { name: 'Updated Action' };
    const mockAction = {
      id: 'action-1',
      plan: {
        application: mockApplication,
      },
    };

    it('should update action successfully', async () => {
      prismaService.action.findUnique.mockResolvedValue(mockAction as any);
      const updatedAction = { ...mockAction, ...actionData };
      prismaService.action.update.mockResolvedValue(updatedAction as any);

      const result = await service.updateAction('action-1', 'user-1', actionData, 'EDITOR');

      expect(prismaService.action.update).toHaveBeenCalledWith({
        where: { id: 'action-1' },
        data: actionData,
      });
      expect(result).toEqual(updatedAction);
    });

    it('should throw NotFoundException when action does not exist', async () => {
      prismaService.action.findUnique.mockResolvedValue(null);

      await expect(service.updateAction('nonexistent', 'user-1', actionData, 'EDITOR'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own application', async () => {
      const otherUserAction = {
        ...mockAction,
        plan: {
          application: { ...mockApplication, userId: 'user-2' },
        },
      };
      prismaService.action.findUnique.mockResolvedValue(otherUserAction as any);

      await expect(service.updateAction('action-1', 'user-1', actionData, 'EDITOR'))
        .rejects.toThrow(ForbiddenException);
    });
  });
});