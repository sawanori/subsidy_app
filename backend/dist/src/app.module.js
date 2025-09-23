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
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const audit_module_1 = require("./common/audit/audit.module");
const i18n_module_1 = require("./common/i18n/i18n.module");
const applications_module_1 = require("./applications/applications.module");
const plans_module_1 = require("./plans/plans.module");
const template_module_1 = require("./template/template.module");
const evidence_module_1 = require("./evidence/evidence.module");
const timezone_middleware_1 = require("./common/middleware/timezone.middleware");
const timestamp_interceptor_1 = require("./common/middleware/timestamp.interceptor");
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
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            i18n_module_1.I18nModule,
            applications_module_1.ApplicationsModule,
            plans_module_1.PlansModule,
            template_module_1.TemplateModule,
            evidence_module_1.EvidenceModule,
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
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map