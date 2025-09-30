import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import {
  CreatePurposeBackgroundDto,
  UpdatePurposeBackgroundDto,
  CreateDetailedPlanDto,
  UpdateDetailedPlanDto,
  CreateDetailedPlansDto,
  CreateKpiTargetDto,
  UpdateKpiTargetDto,
  CreateKpiTargetsDto,
  CreateGanttTaskDto,
  UpdateGanttTaskDto,
  CreateGanttTasksDto,
  Priority,
  KpiCategory,
  ChartType,
  TaskType,
} from './dto';
import { Prisma } from '@generated/prisma';

@Injectable()
export class ExtendedApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  // ============= Purpose Background =============
  async createPurposeBackground(dto: CreatePurposeBackgroundDto) {
    const application = await this.validateApplication(dto.applicationId);
    
    return this.prisma.purposeBackground.create({
      data: {
        applicationId: dto.applicationId,
        currentIssues: dto.currentIssues as unknown as Prisma.InputJsonValue,
        painPoints: dto.painPoints,
        rootCause: dto.rootCause,
        solution: dto.solution,
        approach: dto.approach,
        uniqueValue: dto.uniqueValue,
        logicTree: dto.logicTree as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async updatePurposeBackground(id: string, dto: UpdatePurposeBackgroundDto) {
    await this.validatePurposeBackground(id);
    
    return this.prisma.purposeBackground.update({
      where: { id },
      data: {
        currentIssues: dto.currentIssues as unknown as Prisma.InputJsonValue,
        painPoints: dto.painPoints,
        rootCause: dto.rootCause,
        solution: dto.solution,
        approach: dto.approach,
        uniqueValue: dto.uniqueValue,
        logicTree: dto.logicTree as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async getPurposeBackground(applicationId: string) {
    const result = await this.prisma.purposeBackground.findUnique({
      where: { applicationId },
    });
    
    if (!result) {
      throw new NotFoundException('Purpose background not found');
    }
    
    return result;
  }

  // ============= Detailed Plans =============
  async createDetailedPlans(dto: CreateDetailedPlansDto) {
    const { plans } = dto;
    if (!plans || plans.length === 0) {
      throw new BadRequestException('At least one plan is required');
    }

    const applicationId = plans[0].applicationId;
    await this.validateApplication(applicationId);

    // 既存のプランを削除
    await this.prisma.detailedPlan.deleteMany({
      where: { applicationId },
    });

    // 新しいプランを作成
    return this.prisma.detailedPlan.createMany({
      data: plans.map(plan => ({
        ...plan,
        priority: plan.priority as Priority,
        relatedTaskIds: plan.relatedTaskIds as Prisma.InputJsonValue,
      })),
    });
  }

  async updateDetailedPlan(id: string, dto: UpdateDetailedPlanDto) {
    await this.validateDetailedPlan(id);
    
    return this.prisma.detailedPlan.update({
      where: { id },
      data: {
        what: dto.what,
        why: dto.why,
        who: dto.who,
        where: dto.where,
        when: dto.when,
        how: dto.how,
        priority: dto.priority as Priority,
        category: dto.category,
        expectedResult: dto.expectedResult,
        prerequisite: dto.prerequisite,
        relatedTaskIds: dto.relatedTaskIds as Prisma.InputJsonValue,
        orderIndex: dto.orderIndex,
      },
    });
  }

  async getDetailedPlans(applicationId: string) {
    return this.prisma.detailedPlan.findMany({
      where: { applicationId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  // ============= KPI Targets =============
  async createKpiTargets(dto: CreateKpiTargetsDto) {
    const { targets } = dto;
    if (!targets || targets.length === 0) {
      throw new BadRequestException('At least one KPI target is required');
    }

    const applicationId = targets[0].applicationId;
    await this.validateApplication(applicationId);

    // 既存のKPIを削除
    await this.prisma.kpiTarget.deleteMany({
      where: { applicationId },
    });

    // 新しいKPIを作成
    const createdTargets = await Promise.all(
      targets.map(target =>
        this.prisma.kpiTarget.create({
          data: {
            ...target,
            category: target.category as KpiCategory,
            chartType: target.chartType as ChartType,
            currentValue: new Prisma.Decimal(target.currentValue),
            year1Target: new Prisma.Decimal(target.year1Target),
            year2Target: target.year2Target ? new Prisma.Decimal(target.year2Target) : null,
            year3Target: target.year3Target ? new Prisma.Decimal(target.year3Target) : null,
            assumptions: target.assumptions as Prisma.InputJsonValue,
          },
        })
      )
    );

    // 成長率を計算して返す
    return createdTargets.map(target => ({
      ...target,
      growthRateYear1: this.calculateGrowthRate(target.currentValue, target.year1Target),
      growthRateYear2: target.year2Target ? this.calculateGrowthRate(target.year1Target, target.year2Target) : null,
      growthRateYear3: target.year3Target ? this.calculateGrowthRate(target.year2Target || target.year1Target, target.year3Target) : null,
    }));
  }

  async getKpiTargets(applicationId: string) {
    const targets = await this.prisma.kpiTarget.findMany({
      where: { applicationId },
      orderBy: { displayOrder: 'asc' },
    });

    return targets.map(target => ({
      ...target,
      growthRateYear1: this.calculateGrowthRate(target.currentValue, target.year1Target),
      growthRateYear2: target.year2Target ? this.calculateGrowthRate(target.year1Target, target.year2Target) : null,
      growthRateYear3: target.year3Target ? this.calculateGrowthRate(target.year2Target || target.year1Target, target.year3Target) : null,
    }));
  }

  // ============= Gantt Tasks =============
  async createGanttTasks(dto: CreateGanttTasksDto) {
    const { tasks } = dto;
    if (!tasks || tasks.length === 0) {
      throw new BadRequestException('At least one task is required');
    }

    const applicationId = tasks[0].applicationId;
    await this.validateApplication(applicationId);

    // 既存のタスクを削除
    await this.prisma.ganttTask.deleteMany({
      where: { applicationId },
    });

    // 新しいタスクを作成
    return this.prisma.ganttTask.createMany({
      data: tasks.map(task => ({
        ...task,
        taskType: task.taskType as TaskType,
        dependencies: task.dependencies as unknown as Prisma.InputJsonValue,
        resources: task.resources as Prisma.InputJsonValue,
      })),
    });
  }

  async updateGanttTask(id: string, dto: UpdateGanttTaskDto) {
    await this.validateGanttTask(id);
    
    return this.prisma.ganttTask.update({
      where: { id },
      data: {
        taskName: dto.taskName,
        description: dto.description,
        taskType: dto.taskType as TaskType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        duration: dto.duration,
        progress: dto.progress,
        dependencies: dto.dependencies as unknown as Prisma.InputJsonValue,
        parentTaskId: dto.parentTaskId,
        assignee: dto.assignee,
        assigneeRole: dto.assigneeRole,
        resources: dto.resources as Prisma.InputJsonValue,
        color: dto.color,
        milestone: dto.milestone,
        critical: dto.critical,
        orderIndex: dto.orderIndex,
      },
    });
  }

  async getGanttTasks(applicationId: string) {
    const tasks = await this.prisma.ganttTask.findMany({
      where: { applicationId },
      orderBy: [
        { startDate: 'asc' },
        { orderIndex: 'asc' },
      ],
    });

    // 遅延日数と完了予定日を計算
    return tasks.map(task => {
      const now = new Date();
      const endDate = new Date(task.endDate);
      const delayDays = task.progress < 100 && now > endDate 
        ? Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      const remainingProgress = 100 - task.progress;
      const daysPerPercent = task.duration / 100;
      const estimatedRemainingDays = remainingProgress * daysPerPercent;
      const estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + estimatedRemainingDays);

      return {
        ...task,
        delayDays,
        estimatedCompletionDate: task.progress < 100 ? estimatedCompletionDate : endDate,
      };
    });
  }

  // ============= Utility Methods =============
  private async validateApplication(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    
    return application;
  }

  private async validatePurposeBackground(id: string) {
    const purposeBackground = await this.prisma.purposeBackground.findUnique({
      where: { id },
    });
    
    if (!purposeBackground) {
      throw new NotFoundException('Purpose background not found');
    }
    
    return purposeBackground;
  }

  private async validateDetailedPlan(id: string) {
    const plan = await this.prisma.detailedPlan.findUnique({
      where: { id },
    });
    
    if (!plan) {
      throw new NotFoundException('Detailed plan not found');
    }
    
    return plan;
  }

  private async validateGanttTask(id: string) {
    const task = await this.prisma.ganttTask.findUnique({
      where: { id },
    });
    
    if (!task) {
      throw new NotFoundException('Gantt task not found');
    }
    
    return task;
  }

  private calculateGrowthRate(current: Prisma.Decimal | number, target: Prisma.Decimal | number): number {
    const currentValue = typeof current === 'number' ? current : current.toNumber();
    const targetValue = typeof target === 'number' ? target : target.toNumber();
    
    if (currentValue === 0) return 0;
    return Number(((targetValue - currentValue) / currentValue * 100).toFixed(1));
  }
}