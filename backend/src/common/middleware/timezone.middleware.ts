import { Injectable, NestMiddleware } from '@nestjs/common';
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

@Injectable()
export class TimezoneMiddleware implements NestMiddleware {
  constructor(private readonly i18nService: I18nService) {}

  use(req: TimezonedRequest, res: Response, next: NextFunction) {
    // Extract timezone from headers or use default
    const timezoneHeader = req.headers['x-timezone'] as string;
    const acceptLanguage = req.headers['accept-language'] as string;
    
    // Set timezone (default to Asia/Tokyo)
    req.timezone = timezoneHeader || 'Asia/Tokyo';
    
    // Detect locale from Accept-Language header
    req.locale = this.i18nService.detectLocale(acceptLanguage);
    
    // Attach i18n service to request for easy access
    req.i18n = this.i18nService;
    
    // Add timezone info to response headers for client-side usage
    res.setHeader('x-server-timezone', req.timezone);
    res.setHeader('x-server-locale', req.locale);
    
    next();
  }
}