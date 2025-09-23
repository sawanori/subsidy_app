"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceModule = void 0;
const common_1 = require("@nestjs/common");
const evidence_controller_1 = require("./evidence.controller");
const evidence_service_1 = require("./evidence.service");
const ocr_service_1 = require("./services/ocr.service");
const file_processor_service_1 = require("./services/file-processor.service");
const security_service_1 = require("./services/security.service");
const data_transformation_service_1 = require("./services/data-transformation.service");
const processing_queue_service_1 = require("./services/processing-queue.service");
const storage_optimization_service_1 = require("./services/storage-optimization.service");
const i18n_module_1 = require("../common/i18n/i18n.module");
const prisma_module_1 = require("../prisma/prisma.module");
let EvidenceModule = class EvidenceModule {
};
exports.EvidenceModule = EvidenceModule;
exports.EvidenceModule = EvidenceModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, i18n_module_1.I18nModule],
        controllers: [evidence_controller_1.EvidenceController],
        providers: [
            evidence_service_1.EvidenceService,
            ocr_service_1.OCRService,
            file_processor_service_1.FileProcessorService,
            security_service_1.SecurityService,
            data_transformation_service_1.DataTransformationService,
            processing_queue_service_1.ProcessingQueueService,
            storage_optimization_service_1.StorageOptimizationService,
        ],
        exports: [
            evidence_service_1.EvidenceService,
            ocr_service_1.OCRService,
            file_processor_service_1.FileProcessorService,
            security_service_1.SecurityService,
            data_transformation_service_1.DataTransformationService,
            processing_queue_service_1.ProcessingQueueService,
            storage_optimization_service_1.StorageOptimizationService
        ],
    })
], EvidenceModule);
//# sourceMappingURL=evidence.module.js.map