-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "KpiCategory" AS ENUM ('SALES', 'CUSTOMERS', 'UNIT_PRICE', 'CONVERSION', 'RETENTION', 'EFFICIENCY', 'QUALITY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ChartType" AS ENUM ('LINE', 'BAR', 'AREA', 'PIE', 'GAUGE');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('PHASE', 'TASK', 'SUBTASK', 'MILESTONE');

-- CreateEnum
CREATE TYPE "OrgChartType" AS ENUM ('HIERARCHY', 'MATRIX', 'FLAT', 'NETWORK');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('TECHNICAL', 'MARKET', 'FINANCIAL', 'OPERATIONAL', 'LEGAL', 'REPUTATIONAL', 'STRATEGIC');

-- CreateEnum
CREATE TYPE "RiskAssessmentStatus" AS ENUM ('OPEN', 'MITIGATING', 'MONITORING', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('MARKET_ANALYSIS', 'COMPETITIVE_ANALYSIS', 'BEFORE_AFTER', 'CASE_STUDY', 'EXTERNAL_VALIDATION', 'FINANCIAL_PROJECTION', 'TECHNICAL_SPEC', 'CUSTOM');

-- CreateTable
CREATE TABLE "purpose_backgrounds" (
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
CREATE TABLE "detailed_plans" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "what" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "who" TEXT NOT NULL,
    "where" TEXT NOT NULL,
    "when" TEXT NOT NULL,
    "how" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
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
CREATE TABLE "kpi_targets" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "category" "KpiCategory" NOT NULL,
    "metric" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentValue" DECIMAL(65,30) NOT NULL,
    "year1Target" DECIMAL(65,30) NOT NULL,
    "year2Target" DECIMAL(65,30),
    "year3Target" DECIMAL(65,30),
    "formula" TEXT,
    "assumptions" JSONB,
    "chartType" "ChartType" NOT NULL DEFAULT 'LINE',
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gantt_tasks" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "taskType" "TaskType" NOT NULL DEFAULT 'TASK',
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
CREATE TABLE "organization_structures" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "chartData" JSONB NOT NULL,
    "chartType" "OrgChartType" NOT NULL DEFAULT 'HIERARCHY',
    "raciMatrix" JSONB,
    "externalPartners" JSONB,
    "advisors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_roles" (
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
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "category" "RiskCategory" NOT NULL,
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
    "status" "RiskAssessmentStatus" NOT NULL DEFAULT 'OPEN',
    "reviewDate" TIMESTAMP(3),
    "affectedAreas" JSONB,
    "dependencies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplementary_materials" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "purpose_backgrounds_applicationId_key" ON "purpose_backgrounds"("applicationId");

-- CreateIndex
CREATE INDEX "detailed_plans_applicationId_orderIndex_idx" ON "detailed_plans"("applicationId", "orderIndex");

-- CreateIndex
CREATE INDEX "kpi_targets_applicationId_displayOrder_idx" ON "kpi_targets"("applicationId", "displayOrder");

-- CreateIndex
CREATE INDEX "gantt_tasks_applicationId_startDate_idx" ON "gantt_tasks"("applicationId", "startDate");

-- CreateIndex
CREATE INDEX "gantt_tasks_applicationId_orderIndex_idx" ON "gantt_tasks"("applicationId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "organization_structures_applicationId_key" ON "organization_structures"("applicationId");

-- CreateIndex
CREATE INDEX "organization_roles_structureId_level_idx" ON "organization_roles"("structureId", "level");

-- CreateIndex
CREATE INDEX "risk_assessments_applicationId_riskScore_idx" ON "risk_assessments"("applicationId", "riskScore");

-- CreateIndex
CREATE INDEX "supplementary_materials_applicationId_materialType_idx" ON "supplementary_materials"("applicationId", "materialType");

-- CreateIndex
CREATE INDEX "supplementary_materials_applicationId_orderIndex_idx" ON "supplementary_materials"("applicationId", "orderIndex");

-- AddForeignKey
ALTER TABLE "purpose_backgrounds" ADD CONSTRAINT "purpose_backgrounds_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detailed_plans" ADD CONSTRAINT "detailed_plans_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gantt_tasks" ADD CONSTRAINT "gantt_tasks_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_structures" ADD CONSTRAINT "organization_structures_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_roles" ADD CONSTRAINT "organization_roles_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "organization_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplementary_materials" ADD CONSTRAINT "supplementary_materials_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;