"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const audit_module_1 = require("./common/audit/audit.module");
const i18n_module_1 = require("./common/i18n/i18n.module");
const applications_module_1 = require("./applications/applications.module");
const plans_module_1 = require("./plans/plans.module");
const template_module_1 = require("./template/template.module");
const evidence_module_1 = require("./evidence/evidence.module");
const extended_application_module_1 = require("./modules/extended-application/extended-application.module");
const ai_assistant_module_1 = require("./modules/ai-assistant/ai-assistant.module");
const pdf_generator_module_1 = require("./modules/pdf-generator/pdf-generator.module");
const supabase_module_1 = require("./supabase/supabase.module");
const intake_module_1 = require("./modules/intake/intake.module");
const health_module_1 = require("./modules/health/health.module");
const auto_plan_module_1 = require("./modules/auto-plan/auto-plan.module");
const draft_module_1 = require("./modules/draft/draft.module");
const charts_module_1 = require("./modules/charts/charts.module");
const validate_module_1 = require("./modules/validate/validate.module");
const projects_module_1 = require("./modules/projects/projects.module");
const research_module_1 = require("./modules/research/research.module");
const timezone_middleware_1 = require("./common/middleware/timezone.middleware");
const timestamp_interceptor_1 = require("./common/middleware/timestamp.interceptor");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(timezone_middleware_1.TimezoneMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            prisma_module_1.PrismaModule,
            supabase_module_1.SupabaseModule,
            audit_module_1.AuditModule,
            i18n_module_1.I18nModule,
            applications_module_1.ApplicationsModule,
            plans_module_1.PlansModule,
            template_module_1.TemplateModule,
            evidence_module_1.EvidenceModule,
            extended_application_module_1.ExtendedApplicationModule,
            ai_assistant_module_1.AIAssistantModule,
            intake_module_1.IntakeModule,
            health_module_1.HealthModule,
            auto_plan_module_1.AutoPlanModule,
            draft_module_1.DraftModule,
            charts_module_1.ChartsModule,
            validate_module_1.ValidateModule,
            projects_module_1.ProjectsModule,
            research_module_1.ResearchModule,
            pdf_generator_module_1.PdfGeneratorModule,
            jwt_1.JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
                signOptions: { expiresIn: '1d' },
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 300000,
                    limit: 100,
                }])
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: timestamp_interceptor_1.TimestampInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map