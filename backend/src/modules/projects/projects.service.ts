import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Project, ProjectStatus } from '@generated/prisma';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    schemeId: string;
    userId?: string;
    goal: string;
    constraints: any;
    market: any;
    assets: any;
  }): Promise<Project> {
    return this.prisma.project.create({
      data: {
        ...data,
        status: ProjectStatus.ACTIVE,
      },
    });
  }

  async findOne(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        drafts: {
          orderBy: { version: 'desc' },
        },
        artifacts: true,
        chartSpecs: true,
      },
    });
  }

  async findAll(filters?: {
    schemeId?: string;
    status?: ProjectStatus;
  }): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: filters,
      include: {
        drafts: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      goal: string;
      constraints: any;
      market: any;
      assets: any;
      status: ProjectStatus;
    }>,
  ): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }
}