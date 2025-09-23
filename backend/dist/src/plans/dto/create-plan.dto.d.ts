export declare class CreateActionDto {
    name: string;
    purpose: string;
    deliverable: string;
    evidence: string;
    assignee: string;
    location?: string;
    method?: string;
}
export declare class CreateKpiDto {
    name: string;
    unit: string;
    targetValue: number;
    rationale: string;
    measurementMethod: string;
}
export declare class CreatePlanDto {
    name: string;
    background: string;
    solution: string;
    expectedOutcome: string;
    actions: CreateActionDto[];
    kpis: CreateKpiDto[];
    applicationId: string;
}
