import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../common/i18n/i18n.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';
import { Plan, Action, Schedule, Risk, Organization } from '@generated/prisma';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18nService: I18nService,
  ) {}

  async create(
    userId: string,
    createPlanDto: CreatePlanDto,
    userRole: string = 'EDITOR'
  ): Promise<Plan> {
    // Verify application exists and user has access
    const application = await this.prisma.application.findUnique({
      where: { id: createPlanDto.applicationId },
      include: { user: true }
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${createPlanDto.applicationId} not found`);
    }

    if (userRole !== 'ADMIN' && application.userId !== userId) {
      throw new ForbiddenException('Access denied to this application');
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
            status: 'PLANNED' as const,
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

    // Create KPIs separately (they belong to application)
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

  async findAll(
    userId: string,
    userRole: string = 'VIEWER'
  ): Promise<Plan[]> {
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

  async findOne(id: string, userId: string, userRole: string = 'VIEWER'): Promise<Plan> {
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
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Role-based access control
    if (userRole !== 'ADMIN' && plan.application.userId !== userId) {
      throw new ForbiddenException('Access denied to this plan');
    }

    return plan;
  }

  async update(
    id: string,
    userId: string,
    updatePlanDto: UpdatePlanDto,
    userRole: string = 'EDITOR'
  ): Promise<Plan> {
    const existing = await this.findOne(id, userId, userRole);
    
    if (userRole === 'VIEWER') {
      throw new ForbiddenException('Insufficient permissions to update this plan');
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

  async remove(id: string, userId: string, userRole: string = 'ADMIN'): Promise<void> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can delete plans');
    }

    const plan = await this.findOne(id, userId, userRole);
    
    // Cascade delete related entities
    await this.prisma.plan.delete({
      where: { id },
    });
  }

  // Nested resource methods

  async addAction(planId: string, userId: string, actionData: any, userRole: string = 'EDITOR') {
    const plan = await this.findOne(planId, userId, userRole);
    
    const action = await this.prisma.action.create({
      data: {
        ...actionData,
        planId,
        status: 'PLANNED' as const,
      },
    });

    return action;
  }

  async updateAction(actionId: string, userId: string, actionData: any, userRole: string = 'EDITOR') {
    const action = await this.prisma.action.findUnique({
      where: { id: actionId },
      include: { plan: { include: { application: true } } }
    });

    if (!action) {
      throw new NotFoundException(`Action with ID ${actionId} not found`);
    }

    if (userRole !== 'ADMIN' && action.plan.application.userId !== userId) {
      throw new ForbiddenException('Access denied to this action');
    }

    return await this.prisma.action.update({
      where: { id: actionId },
      data: actionData,
    });
  }

  async addSchedule(planId: string, userId: string, scheduleData: any, userRole: string = 'EDITOR') {
    const plan = await this.findOne(planId, userId, userRole);
    
    const schedule = await this.prisma.schedule.create({
      data: {
        ...scheduleData,
        planId,
      },
    });

    return schedule;
  }

  async addRisk(planId: string, userId: string, riskData: any, userRole: string = 'EDITOR') {
    const plan = await this.findOne(planId, userId, userRole);
    
    const risk = await this.prisma.risk.create({
      data: {
        ...riskData,
        planId,
        status: 'IDENTIFIED' as const,
      },
    });

    return risk;
  }

  async updateOrganization(planId: string, userId: string, orgData: any, userRole: string = 'EDITOR') {
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
}