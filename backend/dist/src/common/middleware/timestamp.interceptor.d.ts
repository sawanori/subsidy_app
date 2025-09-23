import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { I18nService } from '../i18n/i18n.service';
export declare class TimestampInterceptor implements NestInterceptor {
    private readonly i18nService;
    constructor(i18nService: I18nService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private transformTimestamps;
}
