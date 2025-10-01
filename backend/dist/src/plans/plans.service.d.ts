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
        id: string;
        name: string;
        purpose: string;
        deliverable: string;
        evidence: string;
        assignee: string;
        location: string | null;
        scheduledAt: Date | null;
        method: string | null;
        status: import(".prisma/client").$Enums.ActionStatus;
        createdAt: Date;
        updatedAt: Date;
        planId: string;
    }>;
    updateAction(actionId: string, userId: string, actionData: any, userRole?: string): Promise<{
        id: string;
        name: string;
        purpose: string;
        deliverable: string;
        evidence: string;
        assignee: string;
        location: string | null;
        scheduledAt: Date | null;
        method: string | null;
        status: import(".prisma/client").$Enums.ActionStatus;
        createdAt: Date;
        updatedAt: Date;
        planId: string;
    }>;
    addSchedule(planId: string, userId: string, scheduleData: any, userRole?: string): Promise<{
        id: string;
        assignee: string;
        createdAt: Date;
        updatedAt: Date;
        planId: string;
        taskName: string;
        startDate: Date;
        endDate: Date;
        duration: number;
        dependencies: import("@prisma/client/runtime/library").JsonValue | null;
        progress: number;
    }>;
    addRisk(planId: string, userId: string, riskData: any, userRole?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.RiskStatus;
        createdAt: Date;
        updatedAt: Date;
        planId: string;
        content: string;
        probability: import(".prisma/client").$Enums.RiskLevel;
        impact: import(".prisma/client").$Enums.RiskLevel;
        mitigation: string;
        owner: string;
    }>;
    updateOrganization(planId: string, userId: string, orgData: any, userRole?: string): Promise<{
        members: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            role: string;
            workloadPercent: import("@prisma/client/runtime/library").Decimal;
            responsibilities: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        planId: string;
        structure: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
