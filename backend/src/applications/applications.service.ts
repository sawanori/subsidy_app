import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { I18nService } from '../common/i18n/i18n.service';
import { TemplateService } from '../template/template.service';
import { CreateApplicationDto, UpdateApplicationDto, GenerateApplicationDto, GenerationResponseDto } from './dto';
import { PaginationDto, PaginationMetaDto } from '../common/dto/pagination.dto';
import { Application, ApplicationStatus } from '@generated/prisma';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly i18nService: I18nService,
    private readonly templateService: TemplateService,
  ) {}

  async create(
    userId: string, 
    createApplicationDto: CreateApplicationDto,
    req?: any
  ): Promise<Application> {
    // For demo purposes, create a temporary applicant
    // In production, this would be handled via applicant management API
    const tempApplicant = await this.prisma.applicant.create({
      data: {
        companyName: 'Demo Company',
        representativeName: 'Demo User',
        phoneNumber: '000-0000-0000',
        email: 'demo@example.com',
        address: 'Demo Address',
      },
    });

    const application = await this.prisma.application.create({
      data: {
        title: createApplicationDto.title,
        locale: createApplicationDto.locale || 'ja',
        status: createApplicationDto.status || 'DRAFT',
        user: { connect: { id: userId } },
        applicant: { connect: { id: tempApplicant.id } },
      },
      include: {
        user: true,
        applicant: true,
      },
    });

    // Audit log
    await this.auditService.logCreate(
      userId, 
      'application', 
      application.id,
      createApplicationDto,
      req
    );

    return application;
  }

  async findAll(
    userId: string,
    pagination: PaginationDto,
    userRole: string = 'VIEWER'
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Role-based access: VIEWER can only see their own applications
    const whereClause = userRole === 'ADMIN' ? {} : { userId };

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, role: true }
          },
          applicant: {
            select: { 
              id: true, 
              companyName: true, 
              // Don't include personal data for security
            }
          },
          _count: {
            select: { kpis: true, evidences: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.count({ where: whereClause }),
    ]);

    const meta = new PaginationMetaDto(page, limit, total);
    return { data: applications, meta };
  }

  async findOne(id: string, userId: string, userRole: string = 'VIEWER', req?: any): Promise<Application> {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        applicant: true,
        budget: true,
        kpis: true,
        plan: {
          include: {
            actions: true,
            schedules: true,
            organization: {
              include: { members: true }
            },
            risks: true,
          }
        },
        evidences: true,
        competitors: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Role-based access control
    if (userRole !== 'ADMIN' && application.userId !== userId) {
      throw new ForbiddenException('Access denied to this application');
    }

    // Audit log for sensitive data access
    await this.auditService.logAccess(userId, 'application', id, req);

    return application;
  }

  async update(
    id: string,
    userId: string,
    updateApplicationDto: UpdateApplicationDto,
    userRole: string = 'VIEWER',
    req?: any
  ): Promise<Application> {
    const existing = await this.findOne(id, userId, userRole);
    
    // Only allow updates if user owns the application or is ADMIN/EDITOR
    if (userRole === 'VIEWER') {
      throw new ForbiddenException('VIEWER role cannot update applications');
    }
    if (userRole === 'EDITOR' && existing.userId !== userId) {
      throw new ForbiddenException('EDITOR can only update own applications');
    }

    // Don't allow status changes from SUBMITTED unless ADMIN
    if (existing.status === ApplicationStatus.SUBMITTED && 
        updateApplicationDto.status && 
        userRole !== 'ADMIN') {
      throw new ForbiddenException('Cannot modify submitted application');
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: updateApplicationDto,
      include: {
        user: true,
        applicant: true,
      },
    });

    // Audit log
    await this.auditService.logUpdate(
      userId, 
      'application', 
      id,
      updateApplicationDto,
      req
    );

    return updated;
  }

  async remove(id: string, userId: string, userRole: string = 'ADMIN', req?: any): Promise<void> {
    // Only ADMIN can delete applications
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can delete applications');
    }

    const application = await this.findOne(id, userId, userRole);
    
    // Soft delete
    await this.prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await this.auditService.logDelete(userId, 'application', id, req);
  }

  async getStatistics(userId: string, userRole: string = 'VIEWER') {
    const whereClause = userRole === 'ADMIN' ? {} : { userId };

    const stats = await this.prisma.application.groupBy({
      by: ['status'],
      where: {
        ...whereClause,
        deletedAt: null,
      },
      _count: { status: true },
    });

    const total = await this.prisma.application.count({
      where: { ...whereClause, deletedAt: null },
    });

    return { stats, total };
  }

  async generateApplication(
    id: string,
    userId: string,
    userRole: string = 'VIEWER',
    generateDto: GenerateApplicationDto,
    req?: any
  ): Promise<GenerationResponseDto> {
    // First verify access to the application
    const application = await this.findOne(id, userId, userRole, req);

    // Generate unique job ID
    const jobId = `job_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create generation record (in real implementation, this would be in a separate jobs table)
    const generationResponse: GenerationResponseDto = {
      jobId,
      status: 'queued',
      createdAt: new Date(),
    };

    // Log generation request
    await this.auditService.logAccess(
      userId,
      'application_generation',
      id,
      req
    );

    // In production, this would:
    // 1. Queue the generation job
    // 2. Process template resolution
    // 3. Generate PDF/DOCX
    // 4. Store the file securely
    // 5. Return download URL

    // For now, simulate processing
    setTimeout(() => {
      // Simulate completion after 2 seconds
      generationResponse.status = 'completed';
      generationResponse.downloadUrl = `/api/files/download/${jobId}.${generateDto.format}`;
    }, 2000);

    return generationResponse;
  }
}