import { PrismaService } from '../../prisma/prisma.service';
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
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(entry: AuditLogEntry): Promise<void>;
    private maskPersonalData;
    private maskIp;
    private sanitizeDetails;
    logCreate(userId: string, resource: string, resourceId: string, data?: any, req?: any): Promise<void>;
    logUpdate(userId: string, resource: string, resourceId: string, changes?: any, req?: any): Promise<void>;
    logDelete(userId: string, resource: string, resourceId: string, req?: any): Promise<void>;
    logAccess(userId: string, resource: string, resourceId: string, req?: any): Promise<void>;
    logGenerate(userId: string, applicationId: string, generationType: string, req?: any): Promise<void>;
}
