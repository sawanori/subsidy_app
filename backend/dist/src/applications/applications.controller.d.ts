import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto, GenerateApplicationDto } from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    create(createApplicationDto: CreateApplicationDto, req: any): Promise<BaseResponseDto<{
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
    }>>;
    findAll(pagination: PaginationDto, req: any): Promise<BaseResponseDto<{
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
        meta: import("../common/dto/pagination.dto").PaginationMetaDto;
    }>>;
    getStatistics(req: any): Promise<BaseResponseDto<{
        stats: (import("@generated/prisma").Prisma.PickEnumerable<import("@generated/prisma").Prisma.ApplicationGroupByOutputType, "status"[]> & {
            _count: {
                status: number;
            };
        })[];
        total: number;
    }>>;
    findOne(id: string, req: any): Promise<BaseResponseDto<{
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
    }>>;
    update(id: string, updateApplicationDto: UpdateApplicationDto, req: any): Promise<BaseResponseDto<{
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
    }>>;
    remove(id: string, req: any): Promise<BaseResponseDto<any>>;
    generateApplication(id: string, generateDto: GenerateApplicationDto, req: any): Promise<BaseResponseDto<import("./dto").GenerationResponseDto>>;
}
