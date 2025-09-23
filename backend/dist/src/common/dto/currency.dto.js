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
exports.CurrencyResponseDto = exports.BudgetDto = exports.CurrencyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CurrencyDto {
    constructor() {
        this.currency = 'JPY';
    }
}
exports.CurrencyDto = CurrencyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Amount in JPY (no decimal places)',
        example: 1000000,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'number') {
            return Math.round(value);
        }
        return value;
    }),
    __metadata("design:type", Number)
], CurrencyDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Currency code',
        default: 'JPY',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CurrencyDto.prototype, "currency", void 0);
class BudgetDto extends CurrencyDto {
}
exports.BudgetDto = BudgetDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Budget category',
        example: 'personnel',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BudgetDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Budget description',
        example: 'Personnel costs for project',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BudgetDto.prototype, "description", void 0);
class CurrencyResponseDto {
    constructor(amount, currency = 'JPY', formatted) {
        this.amount = amount;
        this.currency = currency;
        this.amount_formatted = formatted;
    }
}
exports.CurrencyResponseDto = CurrencyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Raw amount' }),
    __metadata("design:type", Number)
], CurrencyResponseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Currency code' }),
    __metadata("design:type", String)
], CurrencyResponseDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Formatted amount for display',
        example: '￥1,000,000'
    }),
    __metadata("design:type", String)
], CurrencyResponseDto.prototype, "amount_formatted", void 0);
//# sourceMappingURL=currency.dto.js.map