export declare class BaseResponseDto<T> {
    success: boolean;
    message?: string;
    data?: T;
    constructor(data?: T, message?: string, success?: boolean);
}
