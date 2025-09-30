import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

export interface AuditLogEntry {
  userId: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // For now, we'll log to console and could extend to dedicated audit table
      const logEntry = {
        timestamp: entry.timestamp || new Date(),
        userId: entry.userId,
        userEmail: this.maskPersonalData(entry.userEmail),
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: this.sanitizeDetails(entry.details),
        ip: this.maskIp(entry.ip),
        userAgent: entry.userAgent,
      };

      // Log with structured format
      this.logger.log(`AUDIT_LOG: ${JSON.stringify(logEntry)}`);

      // TODO: In production, send to centralized logging system
      // await this.sendToLoggingSystem(logEntry);
      
    } catch (error) {
      // Ensure audit logging failures don't break the main flow
      console.error('Audit logging failed:', error);
    }
  }

  private maskPersonalData(email?: string): string {
    if (!email) return 'anonymous';
    
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    
    return `${username.slice(0, 2)}***@${domain}`;
  }

  private maskIp(ip?: string): string {
    if (!ip) return 'unknown';
    
    // Mask last octet of IPv4 for privacy
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    
    return 'masked';
  }

  private sanitizeDetails(details?: Record<string, any>): Record<string, any> {
    if (!details) return {};
    
    const sanitized = { ...details };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'accountNumber', 'representativeName', 'phoneNumber', 'address'
    ];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Mask account numbers - show only last 4 digits
    if (sanitized.accountNumber && typeof sanitized.accountNumber === 'string') {
      const accountNum = sanitized.accountNumber;
      sanitized.accountNumber = accountNum.length > 4 
        ? `****${accountNum.slice(-4)}`
        : '[MASKED]';
    }
    
    return sanitized;
  }

  async logCreate(
    userId: string, 
    resource: string, 
    resourceId: string, 
    data?: any,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      userEmail: req?.user?.email,
      action: 'CREATE',
      resource,
      resourceId,
      details: data,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }

  async logUpdate(
    userId: string, 
    resource: string, 
    resourceId: string, 
    changes?: any,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      userEmail: req?.user?.email,
      action: 'UPDATE',
      resource,
      resourceId,
      details: changes,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }

  async logDelete(
    userId: string, 
    resource: string, 
    resourceId: string,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      userEmail: req?.user?.email,
      action: 'DELETE',
      resource,
      resourceId,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }

  async logAccess(
    userId: string, 
    resource: string, 
    resourceId: string,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      userEmail: req?.user?.email,
      action: 'ACCESS',
      resource,
      resourceId,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }

  async logGenerate(
    userId: string, 
    applicationId: string, 
    generationType: string,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      userEmail: req?.user?.email,
      action: 'GENERATE',
      resource: 'document',
      resourceId: applicationId,
      details: { type: generationType },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }
}