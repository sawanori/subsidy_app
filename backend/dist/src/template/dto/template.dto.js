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
exports.ResolvedTemplateResponseDto = exports.TemplateValidationResponseDto = exports.ValidateTemplateDto = exports.ResolveTemplateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ResolveTemplateDto {
    constructor() {
        this.strictMode = false;
        this.sanitizeOutput = true;
        this.timeout = 10000;
    }
}
exports.ResolveTemplateDto = ResolveTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Template content with Handlebars syntax',
        example: '<h1>{{application.title}}</h1><p>Amount: {{formatCurrency application.amount}}</p>',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveTemplateDto.prototype, "template", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Application ID for context data',
        example: 'app-123',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveTemplateDto.prototype, "applicationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Plan ID for context data (optional)',
        example: 'plan-456',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveTemplateDto.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Enable strict mode (fail on missing variables)',
        default: false,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResolveTemplateDto.prototype, "strictMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sanitize HTML output',
        default: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResolveTemplateDto.prototype, "sanitizeOutput", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rendering timeout in milliseconds',
        minimum: 1000,
        maximum: 30000,
        default: 10000,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1000),
    (0, class_validator_1.Max)(30000),
    __metadata("design:type", Number)
], ResolveTemplateDto.prototype, "timeout", void 0);
class ValidateTemplateDto {
}
exports.ValidateTemplateDto = ValidateTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Template content to validate',
        example: '<h1>{{application.title}}</h1><p>{{invalidHelper application.data}}</p>',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidateTemplateDto.prototype, "template", void 0);
class TemplateValidationResponseDto {
}
exports.TemplateValidationResponseDto = TemplateValidationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether template is valid' }),
    __metadata("design:type", Boolean)
], TemplateValidationResponseDto.prototype, "isValid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Validation errors',
        type: [String],
        example: ['Template syntax error: Missing closing tag', 'Unsupported helper: invalidHelper']
    }),
    __metadata("design:type", Array)
], TemplateValidationResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Validation warnings',
        type: [String],
        example: ['Template is large and may impact performance']
    }),
    __metadata("design:type", Array)
], TemplateValidationResponseDto.prototype, "warnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Extracted placeholders',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                key: { type: 'string', example: 'application.title' },
                path: { type: 'string', example: 'application.title' },
                type: { type: 'string', enum: ['string', 'number', 'date', 'currency', 'boolean'], example: 'string' },
                required: { type: 'boolean', example: true },
                description: { type: 'string', example: 'Auto-detected string field from application.title' }
            }
        }
    }),
    __metadata("design:type", Array)
], TemplateValidationResponseDto.prototype, "placeholders", void 0);
class ResolvedTemplateResponseDto {
}
exports.ResolvedTemplateResponseDto = ResolvedTemplateResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Resolved template content',
        example: '<h1>My Application</h1><p>Amount: ¥1,000,000</p>'
    }),
    __metadata("design:type", String)
], ResolvedTemplateResponseDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rendering metadata',
        type: 'object',
        properties: {
            renderTime: { type: 'number', example: 145 },
            placeholderCount: { type: 'number', example: 12 },
            templateSize: { type: 'number', example: 2048 }
        }
    }),
    __metadata("design:type", Object)
], ResolvedTemplateResponseDto.prototype, "metadata", void 0);
//# sourceMappingURL=template.dto.js.map