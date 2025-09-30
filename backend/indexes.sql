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

