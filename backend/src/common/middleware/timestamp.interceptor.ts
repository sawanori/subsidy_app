import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from '../i18n/i18n.service';
import { TimezonedRequest } from './timezone.middleware';

@Injectable()
export class TimestampInterceptor implements NestInterceptor {
  constructor(private readonly i18nService: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<TimezonedRequest>();
    const timezone = request.timezone || 'Asia/Tokyo';
    const locale = request.locale || 'ja';

    return next.handle().pipe(
      map((data) => {
        return this.transformTimestamps(data, timezone, locale);
      }),
    );
  }

  private transformTimestamps(data: any, timezone: string, locale: 'ja' | 'en'): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.transformTimestamps(item, timezone, locale));
    }

    // Handle objects
    if (typeof data === 'object') {
      const transformed = { ...data };
      
      // Transform common timestamp fields
      const timestampFields = [
        'createdAt', 
        'updatedAt', 
        'deletedAt', 
        'submittedAt',
        'startDate',
        'endDate',
        'dueDate'
      ];

      timestampFields.forEach(field => {
        if (transformed[field] && transformed[field] instanceof Date) {
          // Store original UTC timestamp
          transformed[`${field}_utc`] = transformed[field].toISOString();
          
          // Format for display in user's timezone
          transformed[`${field}_formatted`] = this.i18nService.formatDateTime(
            transformed[field],
            undefined,
            { timezone, locale }
          );
        }
      });

      // Recursively transform nested objects
      Object.keys(transformed).forEach(key => {
        if (typeof transformed[key] === 'object' && transformed[key] !== null) {
          transformed[key] = this.transformTimestamps(transformed[key], timezone, locale);
        }
      });

      return transformed;
    }

    return data;
  }
}