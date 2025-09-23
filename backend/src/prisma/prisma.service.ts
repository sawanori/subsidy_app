import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@generated/prisma';
import { I18nService } from '../common/i18n/i18n.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly i18nService?: I18nService) {
    super();
    
    // Note: $use middleware is not available in all Prisma versions
    // For production, consider using a custom interceptor or service layer
  }

  async onModuleInit() {
    // Disable DB connection for demo/development without DB
    try {
      await this.$connect();
    } catch (error) {
      console.log('Database connection skipped for development mode');
    }
  }

  /**
   * Helper method to convert timestamps to UTC before database operations
   * Call this method from your services before creating/updating data
   */
  convertTimestampsToUtc(data: any) {
    const timestampFields = [
      'createdAt',
      'updatedAt',
      'deletedAt',
      'submittedAt',
      'startDate',
      'endDate',
      'dueDate'
    ];

    for (const field of timestampFields) {
      if (data[field] && typeof data[field] !== 'undefined') {
        // If it's a string, parse it first
        if (typeof data[field] === 'string') {
          data[field] = new Date(data[field]);
        }
        
        // Ensure it's stored as UTC
        if (data[field] instanceof Date) {
          // If the date doesn't look like UTC, convert it
          const dateString = data[field].toISOString();
          if (!dateString.endsWith('Z')) {
            data[field] = this.i18nService?.toUtc(data[field]) || new Date(data[field].getTime());
          }
        }
      }
    }

    // Handle nested objects
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
        this.convertTimestampsToUtc(data[key]);
      }
    });

    return data;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}