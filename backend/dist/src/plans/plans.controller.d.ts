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
        applicationId: string;
        background: string;
        solution: string;
        expectedOutcome: string;
        summary: string | null;
    }>>;
    findAll(req: any): Promise<BaseResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
        background: string;
        solution: string;
        expectedOutcome: string;
        summary: string | null;
    }[]>>;
    findOne(id: string, req: any): Promise<BaseResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
        background: string;
        solution: string;
        expectedOutcome: string;
        summary: string | null;
    }>>;
    update(id: string, updatePlanDto: UpdatePlanDto, req: any): Promise<BaseResponseDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
        background: string;
        solution: string;
        expectedOutcome: string;
        summary: string | null;
    }>>;
    remove(id: string, req: any): Promise<BaseResponseDto<any>>;
    addAction(planId: string, actionData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    updateAction(actionId: string, actionData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    addSchedule(planId: string, scheduleData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    addRisk(planId: string, riskData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
    updateOrganization(planId: string, orgData: any, req: any): Promise<BaseResponseDto<{
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
    }>>;
}
