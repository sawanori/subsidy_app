import { z } from 'zod';
export declare const ApplicantSchema: z.ZodObject<{
    companyName: z.ZodString;
    representativeName: z.ZodString;
    phoneNumber: z.ZodString;
    email: z.ZodString;
    address: z.ZodString;
    establishedYear: z.ZodOptional<z.ZodNumber>;
    employeeCount: z.ZodOptional<z.ZodNumber>;
    capital: z.ZodOptional<z.ZodNumber>;
    businessDescription: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const BankAccountSchema: z.ZodObject<{
    bankName: z.ZodString;
    branchName: z.ZodString;
    accountType: z.ZodEnum<{
        NORMAL: "NORMAL";
        CURRENT: "CURRENT";
        SAVINGS: "SAVINGS";
    }>;
    accountNumber: z.ZodString;
    accountHolder: z.ZodString;
}, z.core.$strip>;
export declare const BudgetSchema: z.ZodObject<{
    totalAmount: z.ZodNumber;
    subsidyRate: z.ZodNumber;
    subsidyAmount: z.ZodNumber;
    targetExpenses: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, z.core.$strip>;
export declare const KPISchema: z.ZodObject<{
    name: z.ZodString;
    unit: z.ZodString;
    baselineValue: z.ZodOptional<z.ZodNumber>;
    targetValue: z.ZodNumber;
    achievementDate: z.ZodOptional<z.ZodDate>;
    rationale: z.ZodString;
    measurementMethod: z.ZodString;
}, z.core.$strip>;
export declare const KPIArraySchema: z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    unit: z.ZodString;
    baselineValue: z.ZodOptional<z.ZodNumber>;
    targetValue: z.ZodNumber;
    achievementDate: z.ZodOptional<z.ZodDate>;
    rationale: z.ZodString;
    measurementMethod: z.ZodString;
}, z.core.$strip>>;
export declare const PlanSchema: z.ZodObject<{
    background: z.ZodString;
    solution: z.ZodString;
    expectedOutcome: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ActionSchema: z.ZodObject<{
    name: z.ZodString;
    purpose: z.ZodString;
    deliverable: z.ZodString;
    evidence: z.ZodString;
    assignee: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    method: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ScheduleSchema: z.ZodObject<{
    taskName: z.ZodString;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    duration: z.ZodNumber;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString>>;
    assignee: z.ZodString;
    progress: z.ZodNumber;
}, z.core.$strip>;
export declare const RiskSchema: z.ZodObject<{
    content: z.ZodString;
    probability: z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>;
    impact: z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>;
    mitigation: z.ZodString;
    owner: z.ZodString;
}, z.core.$strip>;
export declare const EvidenceSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    fileUrl: z.ZodOptional<z.ZodString>;
    sourceUrl: z.ZodOptional<z.ZodString>;
    fileType: z.ZodOptional<z.ZodString>;
    fileSize: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const TeamMemberSchema: z.ZodObject<{
    name: z.ZodString;
    role: z.ZodString;
    workloadPercent: z.ZodNumber;
    responsibilities: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CompetitorSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    strengths: z.ZodOptional<z.ZodArray<z.ZodString>>;
    weaknesses: z.ZodOptional<z.ZodArray<z.ZodString>>;
    marketShare: z.ZodOptional<z.ZodNumber>;
    analysisData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export type ApplicantInput = z.infer<typeof ApplicantSchema>;
export type BankAccountInput = z.infer<typeof BankAccountSchema>;
export type BudgetInput = z.infer<typeof BudgetSchema>;
export type KPIInput = z.infer<typeof KPISchema>;
export type PlanInput = z.infer<typeof PlanSchema>;
export type ActionInput = z.infer<typeof ActionSchema>;
export type ScheduleInput = z.infer<typeof ScheduleSchema>;
export type RiskInput = z.infer<typeof RiskSchema>;
export type EvidenceInput = z.infer<typeof EvidenceSchema>;
export type TeamMemberInput = z.infer<typeof TeamMemberSchema>;
export declare const ApplicationSchema: z.ZodObject<{
    title: z.ZodString;
    locale: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type CompetitorInput = z.infer<typeof CompetitorSchema>;
export type ApplicationInput = z.infer<typeof ApplicationSchema>;
