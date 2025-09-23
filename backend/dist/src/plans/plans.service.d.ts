import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../common/i18n/i18n.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';
import { Plan } from '@generated/prisma';
export declare class PlansService {
    private readonly prisma;
    private readonly i18nService;
    constructor(prisma: PrismaService, i18nService: I18nService);
    create(userId: string, createPlanDto: CreatePlanDto, userRole?: string): Promise<Plan>;
    findAll(userId: string, userRole?: string): Promise<Plan[]>;
    findOne(id: string, userId: string, userRole?: string): Promise<Plan>;
    update(id: string, userId: string, updatePlanDto: UpdatePlanDto, userRole?: string): Promise<Plan>;
    remove(id: string, userId: string, userRole?: string): Promise<void>;
    addAction(planId: string, userId: string, actionData: any, userRole?: string): Promise<{
        status: import("@generated/prisma").$Enums.ActionStatus;
        evidence: string;
        createdAt: Date;
        updatedAt: Date;
        id: string;
        name: string;
        planId: string;
        purpose: string;
        deliverable: string;
        assignee: string;
        location: string | null;
        method: string | null;
        scheduledAt: Date | null;
    }>;
    updateAction(actionId: string, userId: string, actionData: any, userRole?: string): Promise<{
        status: import("@generated/prisma").$Enums.ActionStatus;
        evidence: string;
        createdAt: Date;
        updatedAt: Date;
        id: string;
        name: string;
        planId: string;
        purpose: string;
        deliverable: string;
        assignee: string;
        location: string | null;
        method: string | null;
        scheduledAt: Date | null;
    }>;
    addSchedule(planId: string, userId: string, scheduleData: any, userRole?: string): Promise<{
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        id: string;
        planId: string;
        assignee: string;
        taskName: string;
        duration: number;
        dependencies: import("@generated/prisma/runtime/library").JsonValue | null;
        progress: number;
    }>;
    addRisk(planId: string, userId: string, riskData: any, userRole?: string): Promise<{
        status: import("@generated/prisma").$Enums.RiskStatus;
        createdAt: Date;
        updatedAt: Date;
        id: string;
        content: string;
        planId: string;
        probability: import("@generated/prisma").$Enums.RiskLevel;
        impact: import("@generated/prisma").$Enums.RiskLevel;
        mitigation: string;
        owner: string;
    }>;
    updateOrganization(planId: string, userId: string, orgData: any, userRole?: string): Promise<{
        members: {
            createdAt: Date;
            updatedAt: Date;
            id: string;
            name: string;
            role: string;
            workloadPercent: import("@generated/prisma/runtime/library").Decimal;
            responsibilities: string | null;
            organizationId: string;
        }[];
    } & {
        createdAt: Date;
        updatedAt: Date;
        id: string;
        planId: string;
        structure: import("@generated/prisma/runtime/library").JsonValue;
    }>;
}
