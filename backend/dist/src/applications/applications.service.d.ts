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
                role: import(".prisma/client").$Enums.UserRole;
                email: string;
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
            id: string;
            status: import(".prisma/client").$Enums.ApplicationStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            applicantId: string;
            title: string;
            locale: string;
            baselines: import("@prisma/client/runtime/library").JsonValue | null;
            submittedAt: Date | null;
            deletedAt: Date | null;
        })[];
        meta: PaginationMetaDto;
    }>;
    findOne(id: string, userId: string, userRole?: string, req?: any): Promise<Application>;
    update(id: string, userId: string, updateApplicationDto: UpdateApplicationDto, userRole?: string, req?: any): Promise<Application>;
    remove(id: string, userId: string, userRole?: string, req?: any): Promise<void>;
    getStatistics(userId: string, userRole?: string): Promise<{
        stats: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.ApplicationGroupByOutputType, "status"[]> & {
            _count: {
                status: number;
            };
        })[];
        total: number;
    }>;
    generateApplication(id: string, userId: string, userRole: string, generateDto: GenerateApplicationDto, req?: any): Promise<GenerationResponseDto>;
}
