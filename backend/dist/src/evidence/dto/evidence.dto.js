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
exports.EvidenceStatsDto = exports.UploadResponseDto = exports.SecurityScanDto = exports.EvidenceContentDto = exports.EvidenceResponseDto = exports.EvidenceListDto = exports.ImportURLDto = exports.UploadEvidenceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const evidence_interface_1 = require("../interfaces/evidence.interface");
class UploadEvidenceDto {
    constructor() {
        this.enableOCR = true;
        this.ocrLanguages = ['jpn', 'eng'];
        this.extractTables = true;
        this.extractImages = true;
        this.timeout = 60000;
        this.qualityThreshold = 70;
    }
}
exports.UploadEvidenceDto = UploadEvidenceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Evidence source type',
        enum: evidence_interface_1.EvidenceSource,
        example: evidence_interface_1.EvidenceSource.UPLOAD
    }),
    (0, class_validator_1.IsEnum)(evidence_interface_1.EvidenceSource),
    __metadata("design:type", String)
], UploadEvidenceDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Enable OCR processing for images and PDFs',
        default: true,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UploadEvidenceDto.prototype, "enableOCR", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OCR languages (ISO codes)',
        type: [String],
        example: ['jpn', 'eng'],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UploadEvidenceDto.prototype, "ocrLanguages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Extract tables from content',
        default: true,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UploadEvidenceDto.prototype, "extractTables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Extract images from content',
        default: true,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UploadEvidenceDto.prototype, "extractImages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Processing timeout in milliseconds',
        minimum: 5000,
        maximum: 300000,
        default: 60000,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5000),
    (0, class_validator_1.Max)(300000),
    __metadata("design:type", Number)
], UploadEvidenceDto.prototype, "timeout", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quality threshold for OCR (0-100)',
        minimum: 0,
        maximum: 100,
        default: 70,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UploadEvidenceDto.prototype, "qualityThreshold", void 0);
class ImportURLDto {
    constructor() {
        this.enableOCR = true;
        this.ocrLanguages = ['jpn', 'eng'];
        this.timeout = 120000;
    }
}
exports.ImportURLDto = ImportURLDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URL to import evidence from',
        example: 'https://example.com/market-report.pdf'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportURLDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Enable OCR processing',
        default: true,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ImportURLDto.prototype, "enableOCR", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OCR languages',
        type: [String],
        example: ['jpn', 'eng'],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ImportURLDto.prototype, "ocrLanguages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Processing timeout in milliseconds',
        minimum: 10000,
        maximum: 300000,
        default: 120000,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10000),
    (0, class_validator_1.Max)(300000),
    __metadata("design:type", Number)
], ImportURLDto.prototype, "timeout", void 0);
class EvidenceListDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.EvidenceListDto = EvidenceListDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by evidence type',
        enum: evidence_interface_1.EvidenceType,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(evidence_interface_1.EvidenceType),
    __metadata("design:type", String)
], EvidenceListDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by source',
        enum: evidence_interface_1.EvidenceSource,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(evidence_interface_1.EvidenceSource),
    __metadata("design:type", String)
], EvidenceListDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Search in content',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EvidenceListDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number (1-based)',
        minimum: 1,
        default: 1,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], EvidenceListDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Items per page',
        minimum: 1,
        maximum: 100,
        default: 20,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], EvidenceListDto.prototype, "limit", void 0);
class EvidenceResponseDto {
}
exports.EvidenceResponseDto = EvidenceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Evidence ID' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Evidence type',
        enum: evidence_interface_1.EvidenceType
    }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Evidence source',
        enum: evidence_interface_1.EvidenceSource
    }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Original filename' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "originalFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MIME type' }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File size in bytes' }),
    __metadata("design:type", Number)
], EvidenceResponseDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Processing status',
        example: 'completed'
    }),
    __metadata("design:type", String)
], EvidenceResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], EvidenceResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processing completion timestamp' }),
    __metadata("design:type", Date)
], EvidenceResponseDto.prototype, "processedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Processing metadata',
        type: 'object',
        additionalProperties: true
    }),
    __metadata("design:type", Object)
], EvidenceResponseDto.prototype, "metadata", void 0);
class EvidenceContentDto {
}
exports.EvidenceContentDto = EvidenceContentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Extracted text content' }),
    __metadata("design:type", String)
], EvidenceContentDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Extracted tables',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                headers: { type: 'array', items: { type: 'string' } },
                rows: { type: 'array' },
                title: { type: 'string' },
                source: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Array)
], EvidenceContentDto.prototype, "tables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Processed images',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                url: { type: 'string' },
                alt: { type: 'string' },
                dimensions: {
                    type: 'object',
                    properties: {
                        width: { type: 'number' },
                        height: { type: 'number' }
                    }
                },
                ocrText: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Array)
], EvidenceContentDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Structured data (market/competitor info)',
        type: 'object',
        additionalProperties: true
    }),
    __metadata("design:type", Object)
], EvidenceContentDto.prototype, "structured", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OCR results',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                language: { type: 'string' },
                confidence: { type: 'number' },
                text: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Array)
], EvidenceContentDto.prototype, "ocrResults", void 0);
class SecurityScanDto {
}
exports.SecurityScanDto = SecurityScanDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether file is safe' }),
    __metadata("design:type", Boolean)
], SecurityScanDto.prototype, "isSafe", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Virus detected' }),
    __metadata("design:type", Boolean)
], SecurityScanDto.prototype, "virusFound", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Malware signatures found',
        type: [String]
    }),
    __metadata("design:type", Array)
], SecurityScanDto.prototype, "malwareSignatures", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Suspicious patterns',
        type: [String]
    }),
    __metadata("design:type", Array)
], SecurityScanDto.prototype, "suspiciousPatterns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File signature valid' }),
    __metadata("design:type", Boolean)
], SecurityScanDto.prototype, "fileSignatureValid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Scan completion time' }),
    __metadata("design:type", Date)
], SecurityScanDto.prototype, "scanCompletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Scan engine used' }),
    __metadata("design:type", String)
], SecurityScanDto.prototype, "scanEngine", void 0);
class UploadResponseDto {
}
exports.UploadResponseDto = UploadResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Upload successful' }),
    __metadata("design:type", Boolean)
], UploadResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Evidence information' }),
    __metadata("design:type", EvidenceResponseDto)
], UploadResponseDto.prototype, "evidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Security scan result' }),
    __metadata("design:type", SecurityScanDto)
], UploadResponseDto.prototype, "securityScan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processing warnings' }),
    __metadata("design:type", Array)
], UploadResponseDto.prototype, "warnings", void 0);
class EvidenceStatsDto {
}
exports.EvidenceStatsDto = EvidenceStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total evidence count' }),
    __metadata("design:type", Number)
], EvidenceStatsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Count by type',
        type: 'object',
        additionalProperties: { type: 'number' }
    }),
    __metadata("design:type", Object)
], EvidenceStatsDto.prototype, "byType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Count by source',
        type: 'object',
        additionalProperties: { type: 'number' }
    }),
    __metadata("design:type", Object)
], EvidenceStatsDto.prototype, "bySource", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total storage used (bytes)' }),
    __metadata("design:type", Number)
], EvidenceStatsDto.prototype, "totalSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average processing time (ms)' }),
    __metadata("design:type", Number)
], EvidenceStatsDto.prototype, "avgProcessingTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Success rate (0-1)' }),
    __metadata("design:type", Number)
], EvidenceStatsDto.prototype, "successRate", void 0);
//# sourceMappingURL=evidence.dto.js.map