import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    create(createPlanDto: CreatePlanDto, req: any): Promise<BaseResponseDto<{
        summary: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: string;
        applicationId: string;
        background: string;
        solution: string;
        expectedOutcome: string;
    }>>;
    findAll(req: any): Promise<BaseResponseDto<{
        summary: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: string;
        applicationId: string;
        background: string;
        solution: string;
        expectedOutcome: string;
    }[]>>;
    findOne(id: string, req: any): Promise<BaseResponseDto<{
        summary: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: string;
        applicationId: string;
        background: string;
        solution: string;
        expectedOutcome: string;
    }>>;
    update(id: string, updatePlanDto: UpdatePlanDto, req: any): Promise<BaseResponseDto<{
        summary: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: string;
        applicationId: string;
        background: string;
        solution: string;
        expectedOutcome: string;
    }>>;
    remove(id: string, req: any): Promise<BaseResponseDto<any>>;
    addAction(planId: string, actionData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    updateAction(actionId: string, actionData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    addSchedule(planId: string, scheduleData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    addRisk(planId: string, riskData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    updateOrganization(planId: string, orgData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
}
