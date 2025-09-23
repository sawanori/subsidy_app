"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationResponseDto = exports.GenerateApplicationDto = exports.TemplateType = exports.OutputFormat = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var OutputFormat;
(function (OutputFormat) {
    OutputFormat["PDF"] = "pdf";
    OutputFormat["DOCX"] = "docx";
})(OutputFormat || (exports.OutputFormat = OutputFormat = {}));
var TemplateType;
(function (TemplateType) {
    TemplateType["STANDARD"] = "standard";
    TemplateType["DETAILED"] = "detailed";
    TemplateType["SUMMARY"] = "summary";
})(TemplateType || (exports.TemplateType = TemplateType = {}));
class GenerateApplicationDto {
    constructor() {
        this.format = OutputFormat.PDF;
        this.template = TemplateType.STANDARD;
        this.locale = 'ja';
        this.includeSignature = false;
    }
}
exports.GenerateApplicationDto = GenerateApplicationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Output format',
        enum: OutputFormat,
        default: OutputFormat.PDF,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(OutputFormat),
    __metadata("design:type", String)
], GenerateApplicationDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Template type',
        enum: TemplateType,
        default: TemplateType.STANDARD,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TemplateType),
    __metadata("design:type", String)
], GenerateApplicationDto.prototype, "template", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Locale for generation',
        default: 'ja',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateApplicationDto.prototype, "locale", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Include digital signature',
        default: false,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], GenerateApplicationDto.prototype, "includeSignature", void 0);
class GenerationResponseDto {
}
exports.GenerationResponseDto = GenerationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Generation job ID' }),
    __metadata("design:type", String)
], GenerationResponseDto.prototype, "jobId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Generation status' }),
    __metadata("design:type", String)
], GenerationResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Download URL when completed', required: false }),
    __metadata("design:type", String)
], GenerationResponseDto.prototype, "downloadUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], GenerationResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error message if failed', required: false }),
    __metadata("design:type", String)
], GenerationResponseDto.prototype, "error", void 0);
//# sourceMappingURL=generate-application.dto.js.map