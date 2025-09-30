import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    create(createPlanDto: CreatePlanDto, req: any): Promise<BaseResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        solution: string;
        applicationId: string;
        background: string;
        expectedOutcome: string;
        summary: string | null;
    }>>;
    findAll(req: any): Promise<BaseResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        solution: string;
        applicationId: string;
        background: string;
        expectedOutcome: string;
        summary: string | null;
    }[]>>;
    findOne(id: string, req: any): Promise<BaseResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        solution: string;
        applicationId: string;
        background: string;
        expectedOutcome: string;
        summary: string | null;
    }>>;
    update(id: string, updatePlanDto: UpdatePlanDto, req: any): Promise<BaseResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        solution: string;
        applicationId: string;
        background: string;
        expectedOutcome: string;
        summary: string | null;
    }>>;
    remove(id: string, req: any): Promise<BaseResponseDto<any>>;
    addAction(planId: string, actionData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    updateAction(actionId: string, actionData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    addSchedule(planId: string, scheduleData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    addRisk(planId: string, riskData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    updateOrganization(planId: string, orgData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
}
