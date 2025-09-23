export declare class PaginationDto {
    page?: number;
    limit?: number;
}
export declare class PaginationMetaDto {
    page: number;
    limit: number;
    total: number;
    pages: number;
    constructor(page: number, limit: number, total: number);
}
