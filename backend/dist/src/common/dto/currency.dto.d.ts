export declare class CurrencyDto {
    amount: number;
    currency?: string;
}
export declare class BudgetDto extends CurrencyDto {
    category: string;
    description?: string;
}
export declare class CurrencyResponseDto {
    amount: number;
    currency: string;
    amount_formatted?: string;
    constructor(amount: number, currency?: string, formatted?: string);
}
