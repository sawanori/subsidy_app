import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ExtendedApplicationService } from './extended-application.service';
import {
  CreatePurposeBackgroundDto,
  UpdatePurposeBackgroundDto,
  PurposeBackgroundResponseDto,
  CreateDetailedPlansDto,
  UpdateDetailedPlanDto,
  DetailedPlanResponseDto,
  CreateKpiTargetsDto,
  UpdateKpiTargetDto,
  KpiTargetResponseDto,
  CreateGanttTasksDto,
  UpdateGanttTaskDto,
  GanttTaskResponseDto,
} from './dto';

@ApiTags('Extended Application')
@Controller('extended-application')
export class ExtendedApplicationController {
  constructor(private readonly service: ExtendedApplicationService) {}

  // ============= Purpose Background Endpoints =============
  @Post('purpose-background')
  @ApiOperation({ summary: '目的・背景を作成' })
  @ApiResponse({ status: 201, description: '作成成功', type: PurposeBackgroundResponseDto })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 404, description: '申請が見つかりません' })
  async createPurposeBackground(@Body() dto: CreatePurposeBackgroundDto) {
    return this.service.createPurposeBackground(dto);
  }

  @Put('purpose-background/:id')
  @ApiOperation({ summary: '目的・背景を更新' })
  @ApiParam({ name: 'id', description: '目的・背景ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: PurposeBackgroundResponseDto })
  @ApiResponse({ status: 404, description: '目的・背景が見つかりません' })
  async updatePurposeBackground(
    @Param('id') id: string,
    @Body() dto: UpdatePurposeBackgroundDto,
  ) {
    return this.service.updatePurposeBackground(id, dto);
  }

  @Get('purpose-background/application/:applicationId')
  @ApiOperation({ summary: '申請IDで目的・背景を取得' })
  @ApiParam({ name: 'applicationId', description: '申請ID' })
  @ApiResponse({ status: 200, description: '取得成功', type: PurposeBackgroundResponseDto })
  @ApiResponse({ status: 404, description: '目的・背景が見つかりません' })
  async getPurposeBackground(@Param('applicationId') applicationId: string) {
    return this.service.getPurposeBackground(applicationId);
  }

  // ============= Detailed Plans Endpoints =============
  @Post('detailed-plans')
  @ApiOperation({ summary: '詳細計画を一括作成' })
  @ApiResponse({ status: 201, description: '作成成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 404, description: '申請が見つかりません' })
  async createDetailedPlans(@Body() dto: CreateDetailedPlansDto) {
    return this.service.createDetailedPlans(dto);
  }

  @Put('detailed-plan/:id')
  @ApiOperation({ summary: '詳細計画を更新' })
  @ApiParam({ name: 'id', description: '詳細計画ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: DetailedPlanResponseDto })
  @ApiResponse({ status: 404, description: '詳細計画が見つかりません' })
  async updateDetailedPlan(
    @Param('id') id: string,
    @Body() dto: UpdateDetailedPlanDto,
  ) {
    return this.service.updateDetailedPlan(id, dto);
  }

  @Get('detailed-plans/application/:applicationId')
  @ApiOperation({ summary: '申請IDで詳細計画リストを取得' })
  @ApiParam({ name: 'applicationId', description: '申請ID' })
  @ApiResponse({ status: 200, description: '取得成功', type: [DetailedPlanResponseDto] })
  async getDetailedPlans(@Param('applicationId') applicationId: string) {
    return this.service.getDetailedPlans(applicationId);
  }

  // ============= KPI Targets Endpoints =============
  @Post('kpi-targets')
  @ApiOperation({ summary: 'KPI目標を一括作成' })
  @ApiResponse({ status: 201, description: '作成成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 404, description: '申請が見つかりません' })
  async createKpiTargets(@Body() dto: CreateKpiTargetsDto) {
    return this.service.createKpiTargets(dto);
  }

  @Get('kpi-targets/application/:applicationId')
  @ApiOperation({ summary: '申請IDでKPI目標リストを取得' })
  @ApiParam({ name: 'applicationId', description: '申請ID' })
  @ApiResponse({ status: 200, description: '取得成功', type: [KpiTargetResponseDto] })
  async getKpiTargets(@Param('applicationId') applicationId: string) {
    return this.service.getKpiTargets(applicationId);
  }

  // ============= Gantt Tasks Endpoints =============
  @Post('gantt-tasks')
  @ApiOperation({ summary: 'ガントタスクを一括作成' })
  @ApiResponse({ status: 201, description: '作成成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 404, description: '申請が見つかりません' })
  async createGanttTasks(@Body() dto: CreateGanttTasksDto) {
    return this.service.createGanttTasks(dto);
  }

  @Put('gantt-task/:id')
  @ApiOperation({ summary: 'ガントタスクを更新' })
  @ApiParam({ name: 'id', description: 'ガントタスクID' })
  @ApiResponse({ status: 200, description: '更新成功', type: GanttTaskResponseDto })
  @ApiResponse({ status: 404, description: 'ガントタスクが見つかりません' })
  async updateGanttTask(
    @Param('id') id: string,
    @Body() dto: UpdateGanttTaskDto,
  ) {
    return this.service.updateGanttTask(id, dto);
  }

  @Get('gantt-tasks/application/:applicationId')
  @ApiOperation({ summary: '申請IDでガントタスクリストを取得' })
  @ApiParam({ name: 'applicationId', description: '申請ID' })
  @ApiResponse({ status: 200, description: '取得成功', type: [GanttTaskResponseDto] })
  async getGanttTasks(@Param('applicationId') applicationId: string) {
    return this.service.getGanttTasks(applicationId);
  }

  // ============= Aggregated Data Endpoint =============
  @Get('application/:applicationId/all')
  @ApiOperation({ summary: '申請IDで全ての拡張データを取得' })
  @ApiParam({ name: 'applicationId', description: '申請ID' })
  @ApiResponse({ status: 200, description: '取得成功' })
  async getAllExtendedData(@Param('applicationId') applicationId: string) {
    const [purposeBackground, detailedPlans, kpiTargets, ganttTasks] = await Promise.all([
      this.service.getPurposeBackground(applicationId).catch(() => null),
      this.service.getDetailedPlans(applicationId),
      this.service.getKpiTargets(applicationId),
      this.service.getGanttTasks(applicationId),
    ]);

    return {
      applicationId,
      purposeBackground,
      detailedPlans,
      kpiTargets,
      ganttTasks,
    };
  }
}
