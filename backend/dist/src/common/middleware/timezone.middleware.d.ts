import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService } from '../i18n/i18n.service';
export interface TimezonedRequest extends Request {
    timezone?: string;
    locale?: 'ja' | 'en';
    i18n?: I18nService;
    headers: Record<string, string | string[]>;
    user?: {
        id?: string;
        role?: string;
    };
}
export declare class TimezoneMiddleware implements NestMiddleware {
    private readonly i18nService;
    constructor(i18nService: I18nService);
    use(req: TimezonedRequest, res: Response, next: NextFunction): void;
}
