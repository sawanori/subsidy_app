-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('NORMAL', 'CURRENT', 'SAVINGS');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ActionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."RiskStatus" AS ENUM ('IDENTIFIED', 'MITIGATED', 'RESOLVED', 'MONITORING');

-- CreateEnum
CREATE TYPE "public"."EvidenceType" AS ENUM ('CSV', 'EXCEL', 'PDF', 'IMAGE', 'URL', 'TEXT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."EvidenceSource" AS ENUM ('UPLOAD', 'URL_FETCH', 'API_IMPORT');

-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."KpiCategory" AS ENUM ('SALES', 'CUSTOMERS', 'UNIT_PRICE', 'CONVERSION', 'RETENTION', 'EFFICIENCY', 'QUALITY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ChartType" AS ENUM ('LINE', 'BAR', 'AREA', 'PIE', 'GAUGE');

-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('PHASE', 'TASK', 'SUBTASK', 'MILESTONE');

-- CreateEnum
CREATE TYPE "public"."OrgChartType" AS ENUM ('HIERARCHY', 'MATRIX', 'FLAT', 'NETWORK');

-- CreateEnum
CREATE TYPE "public"."RiskCategory" AS ENUM ('TECHNICAL', 'MARKET', 'FINANCIAL', 'OPERATIONAL', 'LEGAL', 'REPUTATIONAL', 'STRATEGIC');

-- CreateEnum
CREATE TYPE "public"."RiskAssessmentStatus" AS ENUM ('OPEN', 'MITIGATING', 'MONITORING', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."MaterialType" AS ENUM ('MARKET_ANALYSIS', 'COMPETITIVE_ANALYSIS', 'BEFORE_AFTER', 'CASE_STUDY', 'EXTERNAL_VALIDATION', 'FINANCIAL_PROJECTION', 'TECHNICAL_SPEC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."GenerationType" AS ENUM ('BACKGROUND', 'PURPOSE', 'PLAN', 'KPI', 'BUDGET', 'SCHEDULE', 'ORGANIZATION', 'RISK', 'SUMMARY');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('OCR', 'GENERATE', 'VALIDATE', 'EXPORT', 'PREFLIGHT', 'REGRESSION', 'UPLOAD', 'PROCESS', 'FETCH', 'INGEST');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "public"."ValidationType" AS ENUM ('FIELD', 'PREFLIGHT', 'BUSINESS_RULE', 'SCHEMA', 'CONSISTENCY', 'COMPLETENESS');

-- CreateEnum
CREATE TYPE "public"."ExportFormat" AS ENUM ('PDF', 'DOCX', 'XLSX', 'ZIP', 'JSON', 'CSV', 'HTML');

-- CreateEnum
CREATE TYPE "public"."TemplateType" AS ENUM ('PDF_OVERLAY', 'DOCX', 'HTML', 'XLSX');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applicants" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "representativeName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "establishedYear" INTEGER,
    "employeeCount" INTEGER,
    "capital" DECIMAL(65,30),
    "businessDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_accounts" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "accountType" "public"."AccountType" NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'ja',
    "baselines" JSONB,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."budgets" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "subsidyRate" DECIMAL(65,30) NOT NULL,
    "subsidyAmount" DECIMAL(65,30) NOT NULL,
    "targetExpenses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kpis" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "baselineValue" DECIMAL(65,30),
    "targetValue" DECIMAL(65,30) NOT NULL,
    "achievementDate" TIMESTAMP(3),
    "rationale" TEXT NOT NULL,
    "measurementMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plans" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."actions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "deliverable" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "assignee" TEXT NOT NULL,
    "location" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "method" TEXT,
    "status" "public"."ActionStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedules" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "dependencies" JSONB,
    "assignee" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "workloadPercent" DECIMAL(65,30) NOT NULL,
    "responsibilities" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."risks" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "probability" "public"."RiskLevel" NOT NULL,
    "impact" "public"."RiskLevel" NOT NULL,
    "mitigation" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" "public"."RiskStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evidences" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "type" "public"."EvidenceType" NOT NULL,
    "source" "public"."EvidenceSource" NOT NULL,
    "status" "public"."ProcessingStatus" NOT NULL DEFAULT 'PROCESSING',
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "checksum" TEXT,
    "fileUrl" TEXT,
    "sourceUrl" TEXT,
    "content" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "securityScan" JSONB,
    "processingTime" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION,
    "title" TEXT,
    "description" TEXT,
    "fileType" TEXT,
    "footnotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."competitors" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "marketShare" DECIMAL(65,30),
    "analysisData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purpose_backgrounds" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "currentIssues" JSONB NOT NULL,
    "painPoints" TEXT NOT NULL,
    "rootCause" TEXT,
    "solution" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "uniqueValue" TEXT,
    "logicTree" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purpose_backgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detailed_plans" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "what" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "who" TEXT NOT NULL,
    "where" TEXT NOT NULL,
    "when" TEXT NOT NULL,
    "how" TEXT NOT NULL,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "prerequisite" TEXT,
    "relatedTaskIds" JSONB,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detailed_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kpi_targets" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "category" "public"."KpiCategory" NOT NULL,
    "metric" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentValue" DECIMAL(65,30) NOT NULL,
    "year1Target" DECIMAL(65,30) NOT NULL,
    "year2Target" DECIMAL(65,30),
    "year3Target" DECIMAL(65,30),
    "formula" TEXT,
    "assumptions" JSONB,
    "chartType" "public"."ChartType" NOT NULL DEFAULT 'LINE',
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gantt_tasks" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "taskType" "public"."TaskType" NOT NULL DEFAULT 'TASK',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "dependencies" JSONB,
    "parentTaskId" TEXT,
    "assignee" TEXT NOT NULL,
    "assigneeRole" TEXT,
    "resources" JSONB,
    "color" TEXT,
    "milestone" BOOLEAN NOT NULL DEFAULT false,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gantt_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_structures" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "chartData" JSONB NOT NULL,
    "chartType" "public"."OrgChartType" NOT NULL DEFAULT 'HIERARCHY',
    "raciMatrix" JSONB,
    "externalPartners" JSONB,
    "advisors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_roles" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "level" INTEGER NOT NULL,
    "reportsTo" TEXT,
    "responsibilities" JSONB NOT NULL,
    "authorities" JSONB,
    "kpis" JSONB,
    "allocation" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."risk_assessments" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "category" "public"."RiskCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "probability" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "preventiveMeasures" JSONB NOT NULL,
    "contingencyPlan" TEXT,
    "triggerPoints" JSONB,
    "owner" TEXT NOT NULL,
    "reviewer" TEXT,
    "status" "public"."RiskAssessmentStatus" NOT NULL DEFAULT 'OPEN',
    "reviewDate" TIMESTAMP(3),
    "affectedAreas" JSONB,
    "dependencies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supplementary_materials" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "materialType" "public"."MaterialType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "visualData" JSONB,
    "marketSize" DECIMAL(65,30),
    "growthRate" DECIMAL(65,30),
    "targetSegment" TEXT,
    "competitiveData" JSONB,
    "positioning" TEXT,
    "beforeState" JSONB,
    "afterState" JSONB,
    "improvements" JSONB,
    "source" TEXT,
    "validUntil" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplementary_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."generation_results" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "public"."GenerationType" NOT NULL,
    "content" TEXT NOT NULL,
    "prompt" TEXT,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "cost" DECIMAL(65,30) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."citations" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "citationNumber" INTEGER NOT NULL,
    "citedText" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "pageNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "type" "public"."JobType" NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER DEFAULT 0,
    "message" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "metadata" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."validation_results" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "public"."ValidationType" NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION,
    "errors" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."preflight_results" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentId" TEXT,
    "passed" BOOLEAN NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "hasEmbeddedFonts" BOOLEAN NOT NULL,
    "hasMargins" BOOLEAN NOT NULL,
    "hasStampSpace" BOOLEAN NOT NULL,
    "fontSize" DOUBLE PRECISION,
    "resolution" INTEGER,
    "colorSpace" TEXT,
    "pdfVersion" TEXT,
    "errors" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preflight_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cost_trackings" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "userId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL,
    "totalCost" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_trackings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."export_histories" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "format" "public"."ExportFormat" NOT NULL,
    "fileUrl" TEXT,
    "downloadUrl" TEXT,
    "size" INTEGER NOT NULL,
    "metadata" JSONB,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "userId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."TemplateType" NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "sha256" TEXT NOT NULL,
    "mappings" JSONB NOT NULL,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subsidy_rules" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "subsidyRate" DECIMAL(65,30) NOT NULL,
    "maxAmount" DECIMAL(65,30),
    "targetExpenses" JSONB NOT NULL,
    "exclusions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsidy_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_applicationId_key" ON "public"."budgets"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_applicationId_key" ON "public"."plans"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_planId_key" ON "public"."organizations"("planId");

-- CreateIndex
CREATE INDEX "evidences_type_source_idx" ON "public"."evidences"("type", "source");

-- CreateIndex
CREATE INDEX "evidences_status_idx" ON "public"."evidences"("status");

-- CreateIndex
CREATE INDEX "evidences_createdAt_idx" ON "public"."evidences"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "purpose_backgrounds_applicationId_key" ON "public"."purpose_backgrounds"("applicationId");

-- CreateIndex
CREATE INDEX "detailed_plans_applicationId_orderIndex_idx" ON "public"."detailed_plans"("applicationId", "orderIndex");

-- CreateIndex
CREATE INDEX "kpi_targets_applicationId_displayOrder_idx" ON "public"."kpi_targets"("applicationId", "displayOrder");

-- CreateIndex
CREATE INDEX "gantt_tasks_applicationId_startDate_idx" ON "public"."gantt_tasks"("applicationId", "startDate");

-- CreateIndex
CREATE INDEX "gantt_tasks_applicationId_orderIndex_idx" ON "public"."gantt_tasks"("applicationId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "organization_structures_applicationId_key" ON "public"."organization_structures"("applicationId");

-- CreateIndex
CREATE INDEX "organization_roles_structureId_level_idx" ON "public"."organization_roles"("structureId", "level");

-- CreateIndex
CREATE INDEX "risk_assessments_applicationId_riskScore_idx" ON "public"."risk_assessments"("applicationId", "riskScore");

-- CreateIndex
CREATE INDEX "supplementary_materials_applicationId_materialType_idx" ON "public"."supplementary_materials"("applicationId", "materialType");

-- CreateIndex
CREATE INDEX "supplementary_materials_applicationId_orderIndex_idx" ON "public"."supplementary_materials"("applicationId", "orderIndex");

-- CreateIndex
CREATE INDEX "generation_results_applicationId_type_createdAt_idx" ON "public"."generation_results"("applicationId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "citations_generationId_idx" ON "public"."citations"("generationId");

-- CreateIndex
CREATE INDEX "citations_evidenceId_idx" ON "public"."citations"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_idempotencyKey_key" ON "public"."jobs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "jobs_type_status_idx" ON "public"."jobs"("type", "status");

-- CreateIndex
CREATE INDEX "jobs_idempotencyKey_idx" ON "public"."jobs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "jobs_applicationId_createdAt_idx" ON "public"."jobs"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "validation_results_applicationId_type_idx" ON "public"."validation_results"("applicationId", "type");

-- CreateIndex
CREATE INDEX "preflight_results_applicationId_createdAt_idx" ON "public"."preflight_results"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "cost_trackings_userId_createdAt_idx" ON "public"."cost_trackings"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "cost_trackings_applicationId_service_idx" ON "public"."cost_trackings"("applicationId", "service");

-- CreateIndex
CREATE INDEX "cost_trackings_createdAt_idx" ON "public"."cost_trackings"("createdAt");

-- CreateIndex
CREATE INDEX "export_histories_applicationId_createdAt_idx" ON "public"."export_histories"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "export_histories_expiresAt_idx" ON "public"."export_histories"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_applicationId_createdAt_idx" ON "public"."audit_logs"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_action_idx" ON "public"."audit_logs"("userId", "action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "public"."audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "public"."feature_flags"("key");

-- CreateIndex
CREATE INDEX "templates_type_isActive_idx" ON "public"."templates"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_version_key" ON "public"."templates"("name", "version");

-- CreateIndex
CREATE INDEX "subsidy_rules_isActive_validFrom_idx" ON "public"."subsidy_rules"("isActive", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "subsidy_rules_category_name_version_key" ON "public"."subsidy_rules"("category", "name", "version");

-- AddForeignKey
ALTER TABLE "public"."bank_accounts" ADD CONSTRAINT "bank_accounts_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "public"."applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "public"."applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budgets" ADD CONSTRAINT "budgets_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kpis" ADD CONSTRAINT "kpis_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plans" ADD CONSTRAINT "plans_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."actions" ADD CONSTRAINT "actions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedules" ADD CONSTRAINT "schedules_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."risks" ADD CONSTRAINT "risks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evidences" ADD CONSTRAINT "evidences_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competitors" ADD CONSTRAINT "competitors_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purpose_backgrounds" ADD CONSTRAINT "purpose_backgrounds_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detailed_plans" ADD CONSTRAINT "detailed_plans_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kpi_targets" ADD CONSTRAINT "kpi_targets_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gantt_tasks" ADD CONSTRAINT "gantt_tasks_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_structures" ADD CONSTRAINT "organization_structures_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_roles" ADD CONSTRAINT "organization_roles_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "public"."organization_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."risk_assessments" ADD CONSTRAINT "risk_assessments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplementary_materials" ADD CONSTRAINT "supplementary_materials_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."generation_results" ADD CONSTRAINT "generation_results_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."citations" ADD CONSTRAINT "citations_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "public"."generation_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."citations" ADD CONSTRAINT "citations_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "public"."evidences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."validation_results" ADD CONSTRAINT "validation_results_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preflight_results" ADD CONSTRAINT "preflight_results_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_trackings" ADD CONSTRAINT "cost_trackings_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cost_trackings" ADD CONSTRAINT "cost_trackings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."export_histories" ADD CONSTRAINT "export_histories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

