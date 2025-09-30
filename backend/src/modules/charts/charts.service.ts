import { Injectable } from '@nestjs/common';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';

@Injectable()
export class ChartsService {
  private chartJSNodeCanvas: ChartJSNodeCanvas;

  constructor() {
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 1200,
      height: 800,
      backgroundColour: 'white',
    });
  }

  /**
   * 折れ線グラフをPNG画像として生成
   */
  async renderLineChart(config: {
    title: string;
    labels: any[];
    data: number[];
    xLabel?: string;
    yLabel?: string;
    footer?: string;
  }): Promise<Buffer> {
    const configuration: ChartConfiguration = {
      type: 'line',
      data: {
        labels: config.labels,
        datasets: [
          {
            label: config.title,
            data: config.data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: config.title,
            font: {
              size: 24,
              weight: 'bold',
            },
            padding: {
              top: 20,
              bottom: 20,
            },
          },
          subtitle: {
            display: !!config.footer,
            text: config.footer || '',
            font: {
              size: 14,
            },
            padding: {
              bottom: 10,
            },
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: !!config.xLabel,
              text: config.xLabel || '',
              font: {
                size: 16,
              },
            },
          },
          y: {
            title: {
              display: !!config.yLabel,
              text: config.yLabel || '',
              font: {
                size: 16,
              },
            },
            beginAtZero: true,
          },
        },
      },
    };

    return this.chartJSNodeCanvas.renderToBuffer(configuration as any);
  }

  /**
   * Ganttチャート生成
   *
   * タスクのスケジュールを横棒グラフで表示
   */
  async renderGanttChart(config: {
    title: string;
    tasks: Array<{
      name: string;
      startDate: string;
      endDate: string;
      progress?: number;
    }>;
  }): Promise<Buffer> {
    const labels = config.tasks.map((t) => t.name);
    const startDates = config.tasks.map((t) => new Date(t.startDate).getTime());
    const endDates = config.tasks.map((t) => new Date(t.endDate).getTime());
    const durations = endDates.map((end, i) => end - startDates[i]);

    const configuration: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '期間',
            data: durations.map((d) => d / (1000 * 60 * 60 * 24)), // Convert to days
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: config.title,
            font: { size: 24, weight: 'bold' },
          },
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '日数',
              font: { size: 16 },
            },
            beginAtZero: true,
          },
        },
      },
    };

    return this.chartJSNodeCanvas.renderToBuffer(configuration as any);
  }

  /**
   * 複数KPIグラフ生成
   *
   * 複数のKPI指標を折れ線グラフで表示
   */
  async renderMultiKPIChart(config: {
    title: string;
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color?: string;
    }>;
    yLabel?: string;
  }): Promise<Buffer> {
    const colors = [
      'rgb(75, 192, 192)',
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)',
      'rgb(153, 102, 255)',
    ];

    const configuration: ChartConfiguration = {
      type: 'line',
      data: {
        labels: config.labels,
        datasets: config.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: dataset.color || colors[index % colors.length],
          backgroundColor: dataset.color
            ? dataset.color.replace('rgb', 'rgba').replace(')', ', 0.2)')
            : colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.2)'),
          tension: 0.3,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: config.title,
            font: { size: 24, weight: 'bold' },
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            title: {
              display: !!config.yLabel,
              text: config.yLabel || '',
              font: { size: 16 },
            },
            beginAtZero: true,
          },
        },
      },
    };

    return this.chartJSNodeCanvas.renderToBuffer(configuration as any);
  }

  /**
   * 組織図生成（簡易版）
   *
   * チーム構成を棒グラフで表示
   */
  async renderOrgChart(config: {
    title: string;
    members: Array<{
      name: string;
      role: string;
      allocation: number;
    }>;
  }): Promise<Buffer> {
    const labels = config.members.map((m) => `${m.name}\n(${m.role})`);
    const data = config.members.map((m) => m.allocation);

    const configuration: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '工数割合（%）',
            data,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: config.title,
            font: { size: 24, weight: 'bold' },
          },
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            title: {
              display: true,
              text: '工数割合（%）',
              font: { size: 16 },
            },
            beginAtZero: true,
            max: 100,
          },
        },
      },
    };

    return this.chartJSNodeCanvas.renderToBuffer(configuration as any);
  }

  /**
   * 既存のrender()メソッド（後方互換性のため維持）
   */
  async render(payload: any) {
    const format = payload?.format || 'png';
    const contentType = format === 'svg' ? 'image/svg+xml' : 'image/png';
    // Skeleton: return 1x1 pixel placeholder image (base64) for wiring
    const png1x1 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg0oT0bQAAAAASUVORK5CYII=';
    const svg1x1 = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>').toString('base64');
    return {
      content_type: contentType,
      base64: format === 'svg' ? svg1x1 : png1x1,
    };
  }
}

