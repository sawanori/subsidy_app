"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const currency_dto_1 = require("./currency.dto");
describe('CurrencyDto', () => {
    it('should validate positive amounts', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(currency_dto_1.CurrencyDto, {
            amount: 1000000,
            currency: 'JPY'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors).toHaveLength(0);
        expect(dto.amount).toBe(1000000);
        expect(dto.currency).toBe('JPY');
    });
    it('should round decimal amounts to integers for JPY', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(currency_dto_1.CurrencyDto, {
            amount: 1000000.99,
            currency: 'JPY'
        });
        expect(dto.amount).toBe(1000001);
    });
    it('should reject negative amounts', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(currency_dto_1.CurrencyDto, {
            amount: -1000,
            currency: 'JPY'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('min');
    });
    it('should default to JPY currency', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(currency_dto_1.CurrencyDto, {
            amount: 1000000,
        });
        expect(dto.currency).toBe('JPY');
    });
});
describe('BudgetDto', () => {
    it('should validate budget data', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(currency_dto_1.BudgetDto, {
            amount: 5000000,
            currency: 'JPY',
            category: 'personnel',
            description: 'Staff costs'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors).toHaveLength(0);
        expect(dto.category).toBe('personnel');
        expect(dto.description).toBe('Staff costs');
    });
    it('should require category', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(currency_dto_1.BudgetDto, {
            amount: 1000000,
            currency: 'JPY',
        });
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'category')).toBe(true);
    });
});
describe('CurrencyResponseDto', () => {
    it('should create response with formatted amount', () => {
        const response = new currency_dto_1.CurrencyResponseDto(1000000, 'JPY', '￥1,000,000');
        expect(response.amount).toBe(1000000);
        expect(response.currency).toBe('JPY');
        expect(response.amount_formatted).toBe('￥1,000,000');
    });
    it('should default to JPY currency', () => {
        const response = new currency_dto_1.CurrencyResponseDto(1000000);
        expect(response.currency).toBe('JPY');
    });
});
//# sourceMappingURL=currency.dto.spec.js.map