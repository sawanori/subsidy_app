"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationSchema = exports.CompetitorSchema = exports.TeamMemberSchema = exports.EvidenceSchema = exports.RiskSchema = exports.ScheduleSchema = exports.ActionSchema = exports.PlanSchema = exports.KPIArraySchema = exports.KPISchema = exports.BudgetSchema = exports.BankAccountSchema = exports.ApplicantSchema = void 0;
const zod_1 = require("zod");
exports.ApplicantSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1).max(200),
    representativeName: zod_1.z.string().min(1).max(100),
    phoneNumber: zod_1.z.string().regex(/^[\d\-\+\(\)]+$/),
    email: zod_1.z.string().email(),
    address: zod_1.z.string().min(1).max(500),
    establishedYear: zod_1.z.number().int().min(1800).max(new Date().getFullYear()).optional(),
    employeeCount: zod_1.z.number().int().min(0).optional(),
    capital: zod_1.z.number().positive().optional(),
    businessDescription: zod_1.z.string().max(1000).optional()
});
exports.BankAccountSchema = zod_1.z.object({
    bankName: zod_1.z.string().min(1).max(100),
    branchName: zod_1.z.string().min(1).max(100),
    accountType: zod_1.z.enum(['NORMAL', 'CURRENT', 'SAVINGS']),
    accountNumber: zod_1.z.string().regex(/^\d+$/),
    accountHolder: zod_1.z.string().min(1).max(100)
});
exports.BudgetSchema = zod_1.z.object({
    totalAmount: zod_1.z.number().int().positive(),
    subsidyRate: zod_1.z.number().min(0).max(1),
    subsidyAmount: zod_1.z.number().int().positive(),
    targetExpenses: zod_1.z.record(zod_1.z.string(), zod_1.z.number().int().positive())
});
exports.KPISchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    unit: zod_1.z.string().min(1).max(50),
    baselineValue: zod_1.z.number().optional(),
    targetValue: zod_1.z.number(),
    achievementDate: zod_1.z.date().optional(),
    rationale: zod_1.z.string().min(1).max(500),
    measurementMethod: zod_1.z.string().min(1).max(300)
});
exports.KPIArraySchema = zod_1.z.array(exports.KPISchema)
    .min(3, "At least 3 KPIs required")
    .max(5, "Maximum 5 KPIs allowed");
exports.PlanSchema = zod_1.z.object({
    background: zod_1.z.string().min(50).max(2000),
    solution: zod_1.z.string().min(50).max(2000),
    expectedOutcome: zod_1.z.string().min(50).max(2000),
    summary: zod_1.z.string().max(200).optional()
});
exports.ActionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    purpose: zod_1.z.string().min(1).max(500),
    deliverable: zod_1.z.string().min(1).max(300),
    evidence: zod_1.z.string().min(1).max(500),
    assignee: zod_1.z.string().min(1).max(100),
    location: zod_1.z.string().max(200).optional(),
    scheduledAt: zod_1.z.date().optional(),
    method: zod_1.z.string().max(500).optional()
});
exports.ScheduleSchema = zod_1.z.object({
    taskName: zod_1.z.string().min(1).max(200),
    startDate: zod_1.z.date(),
    endDate: zod_1.z.date(),
    duration: zod_1.z.number().int().positive(),
    dependencies: zod_1.z.array(zod_1.z.string()).optional(),
    assignee: zod_1.z.string().min(1).max(100),
    progress: zod_1.z.number().int().min(0).max(100)
}).refine(data => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"]
});
exports.RiskSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(500),
    probability: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']),
    impact: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']),
    mitigation: zod_1.z.string().min(1).max(500),
    owner: zod_1.z.string().min(1).max(100)
});
exports.EvidenceSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    fileUrl: zod_1.z.string().url().optional(),
    sourceUrl: zod_1.z.string().url().optional(),
    fileType: zod_1.z.string().optional(),
    fileSize: zod_1.z.number().int().max(50 * 1024 * 1024).optional()
});
exports.TeamMemberSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    role: zod_1.z.string().min(1).max(100),
    workloadPercent: zod_1.z.number().min(0).max(100),
    responsibilities: zod_1.z.string().max(500).optional()
});
exports.CompetitorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    strengths: zod_1.z.array(zod_1.z.string()).optional(),
    weaknesses: zod_1.z.array(zod_1.z.string()).optional(),
    marketShare: zod_1.z.number().min(0).max(100).optional(),
    analysisData: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
});
exports.ApplicationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    locale: zod_1.z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/)
        .default("ja")
        .refine(locale => ['ja', 'en', 'zh-CN', 'ko'].includes(locale), {
        message: "Supported locales: ja, en, zh-CN, ko"
    })
});
//# sourceMappingURL=schemas.js.map