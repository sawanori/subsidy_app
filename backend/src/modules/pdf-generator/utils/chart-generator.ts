import { ChartConfiguration } from 'chart.js';

export class ChartGenerator {
  /**
   * KPIグラフデータを生成
   */
  static generateKPIChartConfig(kpiTargets: any[]): ChartConfiguration {
    const labels = ['現在', '1年目', '2年目', '3年目'];
    const datasets = kpiTargets.map((kpi, index) => ({
      label: kpi.metric,
      data: [
        kpi.currentValue,
        kpi.year1Target,
        kpi.year2Target || kpi.year1Target,
        kpi.year3Target || kpi.year2Target || kpi.year1Target,
      ],
      borderColor: this.getColor(index),
      backgroundColor: this.getColor(index, 0.2),
      tension: 0.4,
    }));

    return {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'KPI目標推移',
            font: { size: 16 },
          },
          legend: {
            display: true,
            position: 'bottom',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '値',
            },
          },
        },
      },
    };
  }

  /**
   * ガントチャートSVGを生成
   */
  static generateGanttChartSVG(tasks: any[]): string {
    const width = 800;
    const height = tasks.length * 40 + 100;
    const startDate = new Date(Math.min(...tasks.map(t => new Date(t.startDate).getTime())));
    const endDate = new Date(Math.max(...tasks.map(t => new Date(t.endDate).getTime())));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dayWidth = (width - 200) / totalDays;

    let svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .task-bar { fill: #3b82f6; opacity: 0.8; }
          .task-bar.milestone { fill: #ef4444; }
          .task-bar.critical { fill: #dc2626; }
          .task-text { font-size: 12px; font-family: sans-serif; }
          .grid-line { stroke: #e5e7eb; stroke-width: 1; }
          .header-text { font-size: 14px; font-weight: bold; }
        </style>
        
        <!-- グリッド -->
        ${this.generateGridLines(width, height, totalDays, dayWidth)}
        
        <!-- ヘッダー -->
        <rect x="0" y="0" width="${width}" height="30" fill="#f3f4f6"/>
        <text x="10" y="20" class="header-text">タスク名</text>
        <text x="210" y="20" class="header-text">スケジュール</text>
        
        <!-- タスク -->
        ${tasks.map((task, index) => this.generateTaskBar(
          task,
          index,
          startDate,
          dayWidth
        )).join('')}
      </svg>
    `;

    return svg;
  }

  /**
   * 組織図SVGを生成
   */
  static generateOrgChartSVG(orgData: any): string {
    const width = 800;
    const height = 600;
    const nodeWidth = 120;
    const nodeHeight = 60;
    const levelHeight = 100;

    // 簡易的な組織図（階層型）
    let svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .org-node { fill: white; stroke: #2563eb; stroke-width: 2; }
          .org-text { font-size: 12px; text-anchor: middle; }
          .org-title { font-weight: bold; }
          .org-line { stroke: #6b7280; stroke-width: 1; fill: none; }
        </style>
        
        <!-- CEO/代表 -->
        <rect x="${width/2 - nodeWidth/2}" y="20" width="${nodeWidth}" height="${nodeHeight}" class="org-node" rx="5"/>
        <text x="${width/2}" y="45" class="org-text org-title">代表取締役</text>
        <text x="${width/2}" y="65" class="org-text">責任者</text>
        
        <!-- 部門 -->
        <line x1="${width/2}" y1="80" x2="${width/2}" y2="120" class="org-line"/>
        <line x1="${width/4}" y1="120" x2="${width*3/4}" y2="120" class="org-line"/>
        
        <!-- 営業部門 -->
        <line x1="${width/4}" y1="120" x2="${width/4}" y2="140" class="org-line"/>
        <rect x="${width/4 - nodeWidth/2}" y="140" width="${nodeWidth}" height="${nodeHeight}" class="org-node" rx="5"/>
        <text x="${width/4}" y="165" class="org-text org-title">営業部</text>
        <text x="${width/4}" y="185" class="org-text">3名</text>
        
        <!-- 開発部門 -->
        <line x1="${width/2}" y1="120" x2="${width/2}" y2="140" class="org-line"/>
        <rect x="${width/2 - nodeWidth/2}" y="140" width="${nodeWidth}" height="${nodeHeight}" class="org-node" rx="5"/>
        <text x="${width/2}" y="165" class="org-text org-title">開発部</text>
        <text x="${width/2}" y="185" class="org-text">5名</text>
        
        <!-- 管理部門 -->
        <line x1="${width*3/4}" y1="120" x2="${width*3/4}" y2="140" class="org-line"/>
        <rect x="${width*3/4 - nodeWidth/2}" y="140" width="${nodeWidth}" height="${nodeHeight}" class="org-node" rx="5"/>
        <text x="${width*3/4}" y="165" class="org-text org-title">管理部</text>
        <text x="${width*3/4}" y="185" class="org-text">2名</text>
      </svg>
    `;

    return svg;
  }

  /**
   * リスクマトリックスSVGを生成
   */
  static generateRiskMatrixSVG(risks: any[]): string {
    const width = 500;
    const height = 500;
    const cellSize = 100;

    let svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .risk-cell-low { fill: #dbeafe; }
          .risk-cell-medium { fill: #fef3c7; }
          .risk-cell-high { fill: #fee2e2; }
          .risk-label { font-size: 12px; text-anchor: middle; }
          .risk-point { fill: #1e40af; }
          .axis-label { font-size: 14px; font-weight: bold; }
        </style>
        
        <!-- グリッド -->
        ${this.generateRiskGrid(cellSize)}
        
        <!-- 軸ラベル -->
        <text x="250" y="490" class="axis-label" text-anchor="middle">影響度 →</text>
        <text x="15" y="250" class="axis-label" text-anchor="middle" transform="rotate(-90 15 250)">発生確率 →</text>
        
        <!-- リスクポイント -->
        ${risks.map(risk => this.plotRiskPoint(risk, cellSize)).join('')}
      </svg>
    `;

    return svg;
  }

  // ヘルパーメソッド
  private static getColor(index: number, alpha: number = 1): string {
    const colors = [
      `rgba(59, 130, 246, ${alpha})`,  // blue
      `rgba(34, 197, 94, ${alpha})`,   // green
      `rgba(251, 146, 60, ${alpha})`,  // orange
      `rgba(168, 85, 247, ${alpha})`,  // purple
      `rgba(251, 113, 133, ${alpha})`, // pink
    ];
    return colors[index % colors.length];
  }

  private static generateGridLines(width: number, height: number, days: number, dayWidth: number): string {
    let lines = '';
    for (let i = 0; i <= days; i += 7) {
      const x = 200 + i * dayWidth;
      lines += `<line x1="${x}" y1="30" x2="${x}" y2="${height}" class="grid-line"/>`;
    }
    return lines;
  }

  private static generateTaskBar(task: any, index: number, startDate: Date, dayWidth: number): string {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const startOffset = Math.ceil((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const x = 200 + startOffset * dayWidth;
    const y = 40 + index * 40;
    const width = duration * dayWidth;
    const height = 25;
    
    let className = 'task-bar';
    if (task.milestone) className += ' milestone';
    if (task.critical) className += ' critical';
    
    return `
      <rect x="${x}" y="${y}" width="${width}" height="${height}" class="${className}" rx="3"/>
      <text x="10" y="${y + 17}" class="task-text">${task.taskName}</text>
      <text x="${x + width + 5}" y="${y + 17}" class="task-text">${task.progress}%</text>
    `;
  }

  private static generateRiskGrid(cellSize: number): string {
    let grid = '';
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const x = 50 + j * cellSize;
        const y = 50 + i * cellSize;
        let className = 'risk-cell-low';
        
        const riskLevel = (5 - i) * (j + 1);
        if (riskLevel >= 15) className = 'risk-cell-high';
        else if (riskLevel >= 8) className = 'risk-cell-medium';
        
        grid += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" class="${className}" stroke="#6b7280" stroke-width="1"/>`;
      }
    }
    
    // ラベル
    for (let i = 1; i <= 5; i++) {
      grid += `<text x="25" y="${50 + (5-i) * cellSize + cellSize/2}" class="risk-label">${i}</text>`;
      grid += `<text x="${50 + (i-1) * cellSize + cellSize/2}" y="40" class="risk-label">${i}</text>`;
    }
    
    return grid;
  }

  private static plotRiskPoint(risk: any, cellSize: number): string {
    const x = 50 + (risk.impact - 1) * cellSize + cellSize / 2;
    const y = 50 + (5 - risk.probability) * cellSize + cellSize / 2;
    
    return `
      <circle cx="${x}" cy="${y}" r="8" class="risk-point"/>
      <text x="${x}" y="${y - 15}" class="risk-label">${risk.title}</text>
    `;
  }
}