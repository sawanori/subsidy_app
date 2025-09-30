import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectStatus } from '@generated/prisma';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @Body()
    body: {
      title: string;
      schemeId: string;
      userId?: string;
      goal: string;
      constraints: any;
      market: any;
      assets: any;
    },
  ) {
    return this.projectsService.create(body);
  }

  @Get()
  async findAll(
    @Query('schemeId') schemeId?: string,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.projectsService.findAll({ schemeId, status });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      title: string;
      goal: string;
      constraints: any;
      market: any;
      assets: any;
      status: ProjectStatus;
    }>,
  ) {
    return this.projectsService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.projectsService.delete(id);
    return { success: true };
  }
}