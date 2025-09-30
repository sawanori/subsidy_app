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
