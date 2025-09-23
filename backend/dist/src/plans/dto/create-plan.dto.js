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
exports.CreatePlanDto = exports.CreateKpiDto = exports.CreateActionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateActionDto {
}
exports.CreateActionDto = CreateActionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'アクション名' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateActionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '目的' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateActionDto.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '期待成果物' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateActionDto.prototype, "deliverable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '根拠・エビデンス' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateActionDto.prototype, "evidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '担当者' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateActionDto.prototype, "assignee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '場所', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateActionDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '方法', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateActionDto.prototype, "method", void 0);
class CreateKpiDto {
}
exports.CreateKpiDto = CreateKpiDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'KPI名' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateKpiDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '単位' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateKpiDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '目標値' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateKpiDto.prototype, "targetValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '根拠・計算式' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateKpiDto.prototype, "rationale", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '測定方法' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateKpiDto.prototype, "measurementMethod", void 0);
class CreatePlanDto {
}
exports.CreatePlanDto = CreatePlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'プラン名' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '背景' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "background", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '解決策' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "solution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '期待効果' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "expectedOutcome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'アクション一覧', type: [CreateActionDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateActionDto),
    __metadata("design:type", Array)
], CreatePlanDto.prototype, "actions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'KPI一覧', type: [CreateKpiDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateKpiDto),
    __metadata("design:type", Array)
], CreatePlanDto.prototype, "kpis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '申請ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "applicationId", void 0);
//# sourceMappingURL=create-plan.dto.js.map