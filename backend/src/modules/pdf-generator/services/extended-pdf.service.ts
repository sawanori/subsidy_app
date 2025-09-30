import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ChartsService } from '@/modules/charts/charts.service';
import pdfParse from 'pdf-parse';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ExtendedPdfService - Phase 5 PDF出力サービス
 *
 * Puppeteer + Handlebarsで草案からPDF生成
 * Phase 6: 図表埋め込み機能追加
 */

@Injectable()
export class ExtendedPdfService {
  private readonly logger = new Logger(ExtendedPdfService.name);
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly chartsService: ChartsService,
  ) {
    this.registerHelpers();
  }

  /**
   * Handlebarsヘルパー登録
   */
  private registerHelpers() {
    // 数値フォーマット（カンマ区切り）
    Handlebars.registerHelper('formatNumber', (value: number) => {
      return value?.toLocaleString('ja-JP') || '0';
    });

    // 日付フォーマット
    Handlebars.registerHelper('formatDate', (date: string) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    });

    // 改行をBRタグに変換
    Handlebars.registerHelper('nl2br', (text: string) => {
      return text ? text.replace(/\n/g, '<br>') : '';
    });
  }

  /**
   * テンプレート取得（キャッシュ対応）
   */
  private async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    this.templateCache.set(templateName, template);
    return template;
  }

  /**
   * 草案からPDF生成（メインメソッド）
   */
  async generateExtendedApplicationPdf(draftId: string): Promise<Buffer> {
    this.logger.log(`Generating PDF for draft: ${draftId}`);

    // 1. Draft取得
    const draft = await this.prisma.draft.findUnique({
      where: { id: draftId },
      include: { project: true }
    });

    if (!draft) {
      throw new Error(`Draft not found: ${draftId}`);
    }

    // 2. SchemeTemplate取得
    const template = await this.prisma.schemeTemplate.findUnique({
      where: { schemeId: (draft as any).project?.schemeId }
    });

    // 3. データ準備
    const data = this.preparePdfData(draft, template);

    // 4. HTML生成
    const html = await this.generateHtml('application', data);

    // 5. PDF生成
    const buffer = await this.htmlToPdf(html);

    this.logger.log(`PDF generated successfully: ${buffer.length} bytes`);
    return buffer;
  }

  /**
   * PDFデータ準備
   */
  private async preparePdfData(draft: any, template: any): Promise<any> {
    const sections: any = draft.sections || {};

    // 予算総額計算
    const budgetTotal = Array.isArray(sections.budget)
      ? sections.budget.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      : 0;

    // 図表生成・埋め込み
    const charts = await this.embedCharts(sections);

    return {
      draftId: draft.id,
      version: draft.version,
      schemeName: template?.name || '補助金制度',
      submissionDate: new Date().toLocaleDateString('ja-JP'),
      generationDate: new Date().toLocaleString('ja-JP'),
      sections,
      budgetTotal,
      ...charts,
    };
  }

  /**
   * 図表埋め込み（Phase 6追加）
   *
   * 草案データから図表を生成し、base64エンコードして埋め込む
   */
  private async embedCharts(sections: any): Promise<{
    ganttChartUrl: string | null;
    kpiChartUrl: string | null;
    orgChartUrl: string | null;
  }> {
    const charts = {
      ganttChartUrl: null as string | null,
      kpiChartUrl: null as string | null,
      orgChartUrl: null as string | null,
    };

    try {
      // 1. Ganttチャート生成
      if (sections.roadmap && Array.isArray(sections.roadmap) && sections.roadmap.length > 0) {
        this.logger.log('Generating Gantt chart...');
        const buffer = await this.chartsService.renderGanttChart({
          title: 'プロジェクトスケジュール',
          tasks: sections.roadmap.map((r: any) => ({
            name: r.task || r.phase || r.name || '未定義',
            startDate: r.startDate || new Date().toISOString(),
            endDate: r.endDate || new Date().toISOString(),
          })),
        });
        charts.ganttChartUrl = `data:image/png;base64,${buffer.toString('base64')}`;
        this.logger.log('Gantt chart generated successfully');
      }

      // 2. KPIグラフ生成
      if (sections.kpi && Array.isArray(sections.kpi) && sections.kpi.length > 0) {
        this.logger.log('Generating KPI chart...');

        // KPIデータをdatasetsに変換
        const labels = ['現状', '目標'];
        const datasets = sections.kpi.map((kpi: any) => ({
          label: kpi.metric || kpi.name || '指標',
          data: [
            Number(kpi.baseline) || 0,
            Number(kpi.target) || 0,
          ],
        }));

        const buffer = await this.chartsService.renderMultiKPIChart({
          title: 'KPI目標値',
          labels,
          datasets,
          yLabel: sections.kpi[0]?.unit || '',
        });
        charts.kpiChartUrl = `data:image/png;base64,${buffer.toString('base64')}`;
        this.logger.log('KPI chart generated successfully');
      }

      // 3. 組織図生成
      if (sections.team && Array.isArray(sections.team) && sections.team.length > 0) {
        this.logger.log('Generating org chart...');
        const buffer = await this.chartsService.renderOrgChart({
          title: 'プロジェクト体制',
          members: sections.team.map((member: any) => ({
            name: member.name || '未定義',
            role: member.role || '担当者',
            allocation: Number(member.allocation) || 100,
          })),
        });
        charts.orgChartUrl = `data:image/png;base64,${buffer.toString('base64')}`;
        this.logger.log('Org chart generated successfully');
      }
    } catch (error) {
      this.logger.error('Error generating charts:', error);
      // エラーが発生してもPDF生成は継続（図表なしで）
    }

    return charts;
  }

  /**
   * HTML生成
   */
  private async generateHtml(templateName: string, data: any): Promise<string> {
    const template = await this.getTemplate(templateName);
    return template(data);
  }

  /**
   * HTML → PDF変換（Puppeteer）
   */
  private async htmlToPdf(html: string): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      // HTML設定
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // PDF生成
      const buffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error('PDF generation error:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * サマリーレポート生成
   */
  async generateSummaryReport(draftId: string): Promise<Buffer> {
    this.logger.log(`Generating summary report for draft: ${draftId}`);

    const draft = await this.prisma.draft.findUnique({
      where: { id: draftId },
      include: { project: true }
    });

    if (!draft) {
      throw new Error(`Draft not found: ${draftId}`);
    }

    // サマリーデータ準備
    const sections: any = draft.sections || {};
    const template = draft?.project?.schemeId
      ? await this.prisma.schemeTemplate.findUnique({ where: { schemeId: (draft as any).project.schemeId } })
      : null;
    const budgetTotal = Array.isArray(sections.budget)
      ? sections.budget.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      : 0;

    const summaryData = {
      title: '申請サマリーレポート',
      draftId: draft.id,
      version: draft.version,
      schemeName: template?.name || '補助金制度',
      generationDate: new Date().toLocaleString('ja-JP'),
      stats: {
        budgetTotal,
        kpiCount: Array.isArray(sections.kpi) ? sections.kpi.length : 0,
        teamSize: Array.isArray(sections.team) ? sections.team.length : 0,
        phases: Array.isArray(sections.roadmap) ? sections.roadmap.length : 0
      },
      sections
    };

    // 簡易HTML生成（サマリー用）
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #2c3e50; }
          .stat { margin: 10px 0; padding: 10px; background: #f8f9fa; }
        </style>
      </head>
      <body>
        <h1>${summaryData.title}</h1>
        <p>Draft ID: ${summaryData.draftId}</p>
        <p>Version: ${summaryData.version}</p>
        <p>制度名: ${summaryData.schemeName}</p>
        <h2>統計情報</h2>
        <div class="stat">予算総額: ${budgetTotal.toLocaleString()}円</div>
        <div class="stat">KPI数: ${summaryData.stats.kpiCount}個</div>
        <div class="stat">チーム人数: ${summaryData.stats.teamSize}名</div>
        <div class="stat">実施フェーズ数: ${summaryData.stats.phases}個</div>
        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
          生成日時: ${summaryData.generationDate}
        </p>
      </body>
      </html>
    `;

    return this.htmlToPdf(html);
  }

  /**
   * PDFパース（既存機能）
   */
  async parseBuffer(buffer: Buffer): Promise<{
    text: string;
    numpages: number;
    info: any;
    metadata: any;
  }> {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      numpages: data.numpages,
      info: data.info,
      metadata: data.metadata
    };
  }
}
