import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { I18nService } from '../common/i18n/i18n.service';
import { TemplateService } from '../template/template.service';
import { CreateApplicationDto, UpdateApplicationDto, GenerateApplicationDto, GenerationResponseDto } from './dto';
import { PaginationDto, PaginationMetaDto } from '../common/dto/pagination.dto';
import { Application } from '@generated/prisma';
export declare class ApplicationsService {
    private readonly prisma;
    private readonly auditService;
    private readonly i18nService;
    private readonly templateService;
    constructor(prisma: PrismaService, auditService: AuditService, i18nService: I18nService, templateService: TemplateService);
    create(userId: string, createApplicationDto: CreateApplicationDto, req?: any): Promise<Application>;
    findAll(userId: string, pagination: PaginationDto, userRole?: string): Promise<{
        data: ({
            user: {
                id: string;
                email: string;
                role: import("@generated/prisma").$Enums.UserRole;
            };
            applicant: {
                id: string;
                companyName: string;
            };
            _count: {
                kpis: number;
                evidences: number;
            };
        } & {
            status: import("@generated/prisma").$Enums.ApplicationStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            submittedAt: Date | null;
            id: string;
            title: string;
            locale: string;
            userId: string;
            applicantId: string;
        })[];
        meta: PaginationMetaDto;
    }>;
    findOne(id: string, userId: string, userRole?: string, req?: any): Promise<Application>;
    update(id: string, userId: string, updateApplicationDto: UpdateApplicationDto, userRole?: string, req?: any): Promise<Application>;
    remove(id: string, userId: string, userRole?: string, req?: any): Promise<void>;
    getStatistics(userId: string, userRole?: string): Promise<{
        stats: (import("@generated/prisma").Prisma.PickEnumerable<import("@generated/prisma").Prisma.ApplicationGroupByOutputType, "status"[]> & {
            _count: {
                status: number;
            };
        })[];
        total: number;
    }>;
    generateApplication(id: string, userId: string, userRole: string, generateDto: GenerateApplicationDto, req?: any): Promise<GenerationResponseDto>;
}
