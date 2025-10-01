import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto, GenerateApplicationDto } from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    create(createApplicationDto: CreateApplicationDto, req: any): Promise<BaseResponseDto<{
        id: string;
        status: import("@generated/prisma").$Enums.ApplicationStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        applicantId: string;
        title: string;
        locale: string;
        baselines: import("@generated/prisma/runtime/library").JsonValue | null;
        submittedAt: Date | null;
        deletedAt: Date | null;
    }>>;
    findAll(pagination: PaginationDto, req: any): Promise<BaseResponseDto<{
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
        meta: import("../common/dto/pagination.dto").PaginationMetaDto;
    }>>;
    getStatistics(req: any): Promise<BaseResponseDto<{
        stats: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.ApplicationGroupByOutputType, "status"[]> & {
            _count: {
                status: number;
            };
        })[];
        total: number;
    }>>;
    findOne(id: string, req: any): Promise<BaseResponseDto<{
        id: string;
        status: import("@generated/prisma").$Enums.ApplicationStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        applicantId: string;
        title: string;
        locale: string;
        baselines: import("@generated/prisma/runtime/library").JsonValue | null;
        submittedAt: Date | null;
        deletedAt: Date | null;
    }>>;
    update(id: string, updateApplicationDto: UpdateApplicationDto, req: any): Promise<BaseResponseDto<{
        id: string;
        status: import("@generated/prisma").$Enums.ApplicationStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        applicantId: string;
        title: string;
        locale: string;
        baselines: import("@generated/prisma/runtime/library").JsonValue | null;
        submittedAt: Date | null;
        deletedAt: Date | null;
    }>>;
    remove(id: string, req: any): Promise<BaseResponseDto<any>>;
    generateApplication(id: string, generateDto: GenerateApplicationDto, req: any): Promise<BaseResponseDto<import("./dto").GenerationResponseDto>>;
}
