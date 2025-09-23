import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomThrottlerGuard } from '../common/guards/throttler.guard';

@ApiTags('plans')
@Controller('plans')
@UseGuards(CustomThrottlerGuard, RolesGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async create(
    @Body() createPlanDto: CreatePlanDto,
    @Request() req: any
  ) {
    const plan = await this.plansService.create(
      req.user?.id || 'anonymous',
      createPlanDto,
      req.user?.role || Role.EDITOR
    );

    return new BaseResponseDto(plan, 'Plan created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
  })
  async findAll(@Request() req: any) {
    const plans = await this.plansService.findAll(
      req.user?.id || 'anonymous',
      req.user?.role || Role.VIEWER
    );

    return new BaseResponseDto(plans, 'Plans retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID with nested resources' })
  @ApiResponse({
    status: 200,
    description: 'Plan retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const plan = await this.plansService.findOne(
      id,
      req.user?.id || 'anonymous',
      req.user?.role || Role.VIEWER
    );

    return new BaseResponseDto(plan, 'Plan retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update plan' })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @Request() req: any
  ) {
    const plan = await this.plansService.update(
      id,
      req.user?.id || 'anonymous',
      updatePlanDto,
      req.user?.role || Role.EDITOR
    );

    return new BaseResponseDto(plan, 'Plan updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete plan' })
  @ApiResponse({
    status: 200,
    description: 'Plan deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.plansService.remove(
      id,
      req.user?.id || 'anonymous',
      req.user?.role || Role.ADMIN
    );

    return new BaseResponseDto(null, 'Plan deleted successfully');
  }

  // Nested resource endpoints

  @Post(':id/actions')
  @ApiOperation({ summary: 'Add action to plan' })
  @ApiResponse({ status: 201, description: 'Action added successfully' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async addAction(
    @Param('id') planId: string,
    @Body() actionData: any,
    @Request() req: any
  ) {
    const action = await this.plansService.addAction(
      planId,
      req.user?.id || 'anonymous',
      actionData,
      req.user?.role || Role.EDITOR
    );

    return new BaseResponseDto(action, 'Action added successfully');
  }

  @Patch('actions/:actionId')
  @ApiOperation({ summary: 'Update action' })
  @ApiResponse({ status: 200, description: 'Action updated successfully' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async updateAction(
    @Param('actionId') actionId: string,
    @Body() actionData: any,
    @Request() req: any
  ) {
    const action = await this.plansService.updateAction(
      actionId,
      req.user?.id || 'anonymous',
      actionData,
      req.user?.role || Role.EDITOR
    );

    return new BaseResponseDto(action, 'Action updated successfully');
  }

  @Post(':id/schedules')
  @ApiOperation({ summary: 'Add schedule to plan' })
  @ApiResponse({ status: 201, description: 'Schedule added successfully' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async addSchedule(
    @Param('id') planId: string,
    @Body() scheduleData: any,
    @Request() req: any
  ) {
    const schedule = await this.plansService.addSchedule(
      planId,
      req.user?.id || 'anonymous',
      scheduleData,
      req.user?.role || Role.EDITOR
    );

    return new BaseResponseDto(schedule, 'Schedule added successfully');
  }

  @Post(':id/risks')
  @ApiOperation({ summary: 'Add risk to plan' })
  @ApiResponse({ status: 201, description: 'Risk added successfully' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async addRisk(
    @Param('id') planId: string,
    @Body() riskData: any,
    @Request() req: any
  ) {
    const risk = await this.plansService.addRisk(
      planId,
      req.user?.id || 'anonymous',
      riskData,
      req.user?.role || Role.EDITOR
    );

    return new BaseResponseDto(risk, 'Risk added successfully');
  }

  @Put(':id/organization')
  @ApiOperation({ summary: 'Update organization structure' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @Roles(Role.EDITOR, Role.ADMIN)
  async updateOrganization(
    @Param('id') planId: string,
    @Body() orgData: any,
    @Request() req: any
  ) {
    const organization = await this.plansService.updateOrganization(
      planId,
      req.user?.id || 'anonymous',
      orgData,
      req.user?.role || Role.EDITOR
    );

    return new BaseResponseDto(organization, 'Organization updated successfully');
  }
}