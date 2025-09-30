import { Body, Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ChartsService } from './charts.service';

/**
 * ChartsController - 図表生成APIエンドポイント
 *
 * Ganttチャート、組織図、KPIグラフなどの生成
 */
@Controller('charts')
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  /**
   * POST /api/charts/gantt
   *
   * Ganttチャート生成
   */
  @Post('gantt')
  async renderGantt(
    @Body()
    body: {
      title: string;
      tasks: Array<{
        name: string;
        startDate: string;
        endDate: string;
        progress?: number;
      }>;
    },
    @Res() res: Response,
  ) {
    const buffer = await this.chartsService.renderGanttChart(body);
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
    });
    res.status(HttpStatus.OK).send(buffer);
  }

  /**
   * POST /api/charts/kpi
   *
   * 複数KPIグラフ生成
   */
  @Post('kpi')
  async renderKPI(
    @Body()
    body: {
      title: string;
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        color?: string;
      }>;
      yLabel?: string;
    },
    @Res() res: Response,
  ) {
    const buffer = await this.chartsService.renderMultiKPIChart(body);
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
    });
    res.status(HttpStatus.OK).send(buffer);
  }

  /**
   * POST /api/charts/org
   *
   * 組織図生成
   */
  @Post('org')
  async renderOrg(
    @Body()
    body: {
      title: string;
      members: Array<{
        name: string;
        role: string;
        allocation: number;
      }>;
    },
    @Res() res: Response,
  ) {
    const buffer = await this.chartsService.renderOrgChart(body);
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
    });
    res.status(HttpStatus.OK).send(buffer);
  }

  /**
   * POST /api/charts/render
   *
   * 既存のrender()メソッド（後方互換性のため維持）
   */
  @Post('render')
  async render(@Body() body: any) {
    return this.chartsService.render(body);
  }
}

