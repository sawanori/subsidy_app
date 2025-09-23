"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(entry) {
        try {
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
            console.log('AUDIT_LOG:', JSON.stringify(logEntry));
        }
        catch (error) {
            console.error('Audit logging failed:', error);
        }
    }
    maskPersonalData(email) {
        if (!email)
            return 'anonymous';
        const [username, domain] = email.split('@');
        if (username.length <= 2)
            return email;
        return `${username.slice(0, 2)}***@${domain}`;
    }
    maskIp(ip) {
        if (!ip)
            return 'unknown';
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
        }
        return 'masked';
    }
    sanitizeDetails(details) {
        if (!details)
            return {};
        const sanitized = { ...details };
        const sensitiveFields = [
            'password', 'token', 'secret', 'key', 'authorization',
            'accountNumber', 'representativeName', 'phoneNumber', 'address'
        ];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        if (sanitized.accountNumber && typeof sanitized.accountNumber === 'string') {
            const accountNum = sanitized.accountNumber;
            sanitized.accountNumber = accountNum.length > 4
                ? `****${accountNum.slice(-4)}`
                : '[MASKED]';
        }
        return sanitized;
    }
    async logCreate(userId, resource, resourceId, data, req) {
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
    async logUpdate(userId, resource, resourceId, changes, req) {
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
    async logDelete(userId, resource, resourceId, req) {
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
    async logAccess(userId, resource, resourceId, req) {
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
    async logGenerate(userId, applicationId, generationType, req) {
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
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map