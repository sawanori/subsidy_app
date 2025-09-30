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
        evidence: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@generated/prisma").$Enums.ActionStatus;
        assignee: string;
        purpose: string;
        deliverable: string;
        location: string | null;
        scheduledAt: Date | null;
        method: string | null;
        planId: string;
    }>;
    updateAction(actionId: string, userId: string, actionData: any, userRole?: string): Promise<{
        evidence: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@generated/prisma").$Enums.ActionStatus;
        assignee: string;
        purpose: string;
        deliverable: string;
        location: string | null;
        scheduledAt: Date | null;
        method: string | null;
        planId: string;
    }>;
    addSchedule(planId: string, userId: string, scheduleData: any, userRole?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        taskName: string;
        startDate: Date;
        endDate: Date;
        duration: number;
        progress: number;
        dependencies: import("@generated/prisma/runtime/library").JsonValue | null;
        assignee: string;
        planId: string;
    }>;
    addRisk(planId: string, userId: string, riskData: any, userRole?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@generated/prisma").$Enums.RiskStatus;
        planId: string;
        content: string;
        probability: import("@generated/prisma").$Enums.RiskLevel;
        impact: import("@generated/prisma").$Enums.RiskLevel;
        mitigation: string;
        owner: string;
    }>;
    updateOrganization(planId: string, userId: string, orgData: any, userRole?: string): Promise<{
        members: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            role: string;
            workloadPercent: import("@generated/prisma/runtime/library").Decimal;
            responsibilities: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        planId: string;
        structure: import("@generated/prisma/runtime/library").JsonValue;
    }>;
}
