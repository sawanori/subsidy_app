import { z } from 'zod';

// Applicant validation schema (personal data classification)
export const ApplicantSchema = z.object({
  companyName: z.string().min(1).max(200),
  representativeName: z.string().min(1).max(100), // personal data
  phoneNumber: z.string().regex(/^[\d\-\+\(\)]+$/), // personal data
  email: z.string().email(), // personal data
  address: z.string().min(1).max(500), // personal data
  establishedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  employeeCount: z.number().int().min(0).optional(),
  capital: z.number().positive().optional(),
  businessDescription: z.string().max(1000).optional()
});

// Bank account validation (personal data - masked display)
export const BankAccountSchema = z.object({
  bankName: z.string().min(1).max(100),
  branchName: z.string().min(1).max(100),
  accountType: z.enum(['NORMAL', 'CURRENT', 'SAVINGS']),
  accountNumber: z.string().regex(/^\d+$/), // numeric only, masked in UI
  accountHolder: z.string().min(1).max(100) // personal data
});

// Budget validation (JPY no decimals per governance)
export const BudgetSchema = z.object({
  totalAmount: z.number().int().positive(), // JPY integer
  subsidyRate: z.number().min(0).max(1), // 0-100% as decimal
  subsidyAmount: z.number().int().positive(), // calculated field
  targetExpenses: z.record(z.string(), z.number().int().positive()) // structured expenses
});

// KPI validation (3-5 KPIs per governance requirement)
export const KPISchema = z.object({
  name: z.string().min(1).max(200),
  unit: z.string().min(1).max(50),
  baselineValue: z.number().optional(),
  targetValue: z.number(),
  achievementDate: z.date().optional(),
  rationale: z.string().min(1).max(500), // justification required
  measurementMethod: z.string().min(1).max(300)
});

export const KPIArraySchema = z.array(KPISchema)
  .min(3, "At least 3 KPIs required")
  .max(5, "Maximum 5 KPIs allowed");

// Plan validation with 200 char summary
export const PlanSchema = z.object({
  background: z.string().min(50).max(2000),
  solution: z.string().min(50).max(2000),
  expectedOutcome: z.string().min(50).max(2000),
  summary: z.string().max(200).optional() // auto-generated
});

// Action validation with 5W1H structure
export const ActionSchema = z.object({
  name: z.string().min(1).max(200), // What
  purpose: z.string().min(1).max(500), // Why
  deliverable: z.string().min(1).max(300), // What outcome
  evidence: z.string().min(1).max(500), // Supporting rationale
  assignee: z.string().min(1).max(100), // Who
  location: z.string().max(200).optional(), // Where
  scheduledAt: z.date().optional(), // When
  method: z.string().max(500).optional() // How
});

// Schedule validation for Gantt chart
export const ScheduleSchema = z.object({
  taskName: z.string().min(1).max(200),
  startDate: z.date(),
  endDate: z.date(),
  duration: z.number().int().positive(),
  dependencies: z.array(z.string()).optional(),
  assignee: z.string().min(1).max(100),
  progress: z.number().int().min(0).max(100)
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
});

// Risk validation
export const RiskSchema = z.object({
  content: z.string().min(1).max(500),
  probability: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  mitigation: z.string().min(1).max(500),
  owner: z.string().min(1).max(100)
});

// Evidence file validation (per security baseline)
export const EvidenceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  fileUrl: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().int().max(50 * 1024 * 1024).optional() // 50MB limit
});

// Team member validation
export const TeamMemberSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  workloadPercent: z.number().min(0).max(100), // allocation percentage
  responsibilities: z.string().max(500).optional()
});

// Competitor analysis validation
export const CompetitorSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  marketShare: z.number().min(0).max(100).optional(),
  analysisData: z.record(z.string(), z.any()).optional()
});

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
// Application validation with locale (personal data classification)
export const ApplicationSchema = z.object({
  title: z.string().min(1).max(200),
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/) // ISO 639-1 format (personal data)
    .default("ja")
    .refine(locale => ['ja', 'en', 'zh-CN', 'ko'].includes(locale), {
      message: "Supported locales: ja, en, zh-CN, ko"
    })
});

export type CompetitorInput = z.infer<typeof CompetitorSchema>;
export type ApplicationInput = z.infer<typeof ApplicationSchema>;