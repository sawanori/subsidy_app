import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto, GenerateApplicationDto } from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomThrottlerGuard } from '../common/guards/throttler.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

@ApiTags('applications')
@Controller('applications')
@UseGuards(CustomThrottlerGuard, SupabaseAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  @ApiResponse({
    status: 201,
    description: 'Application created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Request() req: any
  ) {
    const application = await this.applicationsService.create(
      req.user.id,
      createApplicationDto,
      req
    );

    return new BaseResponseDto(application, 'Application created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all applications with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Applications retrieved successfully',
  })
  async findAll(
    @Query() pagination: PaginationDto,
    @Request() req: any
  ) {
    const result = await this.applicationsService.findAll(
      req.user.id,
      pagination,
      req.user.role || Role.VIEWER
    );

    return new BaseResponseDto(result, 'Applications retrieved successfully');
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get application statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Request() req: any) {
    const stats = await this.applicationsService.getStatistics(
      req.user.id,
      req.user.role || Role.VIEWER
    );

    return new BaseResponseDto(stats, 'Statistics retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiResponse({
    status: 200,
    description: 'Application retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const application = await this.applicationsService.findOne(
      id,
      req.user.id,
      req.user.role || Role.VIEWER,
      req
    );

    return new BaseResponseDto(application, 'Application retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update application' })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Request() req: any
  ) {
    const application = await this.applicationsService.update(
      id,
      req.user.id,
      updateApplicationDto,
      req.user.role || Role.EDITOR,
      req
    );

    return new BaseResponseDto(application, 'Application updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete application' })
  @ApiResponse({
    status: 200,
    description: 'Application deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.applicationsService.remove(
      id,
      req.user.id,
      req.user.role || Role.ADMIN,
      req
    );

    return new BaseResponseDto(null, 'Application deleted successfully');
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate application document' })
  @ApiResponse({
    status: 202,
    description: 'Generation job created successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles(Role.VIEWER, Role.EDITOR, Role.ADMIN)
  async generateApplication(
    @Param('id') id: string,
    @Body() generateDto: GenerateApplicationDto,
    @Request() req: any
  ) {
    const generationResult = await this.applicationsService.generateApplication(
      id,
      req.user.id,
      req.user.role || Role.VIEWER,
      generateDto,
      req
    );

    return new BaseResponseDto(
      generationResult, 
      'Generation job created successfully'
    );
  }
}