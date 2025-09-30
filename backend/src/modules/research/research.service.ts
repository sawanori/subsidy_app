import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CsvService } from './services/csv.service';
import { NormalizeService } from './services/normalize.service';
import { MetricsService } from './services/metrics.service';
import { EStatConnector } from './connectors/estat.connector';
import { ResasConnector } from './connectors/resas.connector';
import { ChartsService } from '../charts/charts.service';
import { OpenAIProvider } from '../draft/llm/openai.provider';
import { writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvService: CsvService,
    private readonly normalizeService: NormalizeService,
    private readonly metricsService: MetricsService,
    private readonly eStatConnector: EStatConnector,
    private readonly resasConnector: ResasConnector,
    private readonly chartsService: ChartsService,
    private readonly openaiProvider: OpenAIProvider,
  ) {}

  async fetchData(fetchDto: any) {
    // Stub implementation for fetching research data
    return {
      success: true,
      data: fetchDto,
      message: 'Data fetched successfully'
    };
  }

  async ingestData(ingestDto: any) {
    // Stub implementation for ingesting research data
    return {
      success: true,
      data: ingestDto,
      message: 'Data ingested successfully'
    };
  }

  async createEmbedding(embeddingDto: any) {
    // Stub implementation for creating embeddings
    return {
      success: true,
      embedding: [],
      message: 'Embedding created successfully'
    };
  }

  async findOne(id: string) {
    // Stub implementation for finding a single research item
    return {
      id,
      title: 'Research Item',
      data: {}
    };
  }

  async findAll(query: any) {
    // Stub implementation for listing research items
    return {
      items: [],
      total: 0,
      page: query.page || 1,
      limit: query.limit || 10
    };
  }

  async summarize(dto: any) {
    return {
      summary: `${dto?.region ?? '国内'}の${dto?.industry ?? ''}に関する最新動向の要約（サンプル）`,
      sources: [
        { title: '電子商取引に関する市場調査', publisher: '経産省', year: 2024, url: 'https://example.com', notes: 'BtoC市場規模' },
      ],
      datasets: [
        { name: 'ec_market_size', unit: '兆円', rows: [[2019, 19.4], [2020, 22.0], [2021, 24.0]] },
      ],
    };
  }

  /**
   * CSVファイルを処理してグラフとAI説明文を生成
   */
  async processCsv(
    file: Express.Multer.File,
    meta: { title: string; xLabel?: string; yLabel?: string },
  ) {
    try {
      // 1. CSV解析
      const parsedData = await this.csvService.parse(file.path);
      const { labels, values } = this.csvService.normalize(parsedData);

      // 2. グラフ生成
      const chartBuffer = await this.chartsService.renderLineChart({
        title: meta.title,
        labels,
        data: values,
        xLabel: meta.xLabel,
        yLabel: meta.yLabel,
        footer: `出典: ユーザー提供データ (${file.originalname})`,
      });

      // 3. 画像保存
      const chartFilename = `chart_${Date.now()}.png`;
      const chartPath = join(process.cwd(), 'uploads', 'charts', chartFilename);
      writeFileSync(chartPath, chartBuffer);

      // 4. OpenAI説明文生成
      const explanation = await this.openaiProvider.generateExplanation({
        title: meta.title,
        dataPoints: parsedData,
      });

      // 5. 出典情報
      const sources = [
        {
          type: 'user_upload',
          filename: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      ];

      return {
        chartUrl: `/uploads/charts/${chartFilename}`,
        explanation,
        sources,
      };
    } catch (error) {
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }

  /**
   * e-Statデータ取得と分析
   *
   * @param params.statsDataId - 統計表ID
   * @param params.title - グラフタイトル
   * @param params.indicators - 計算する指標（CAGR, YoY等）
   */
  async fetchEStatData(params: {
    statsDataId: string;
    title?: string;
    indicators?: string[];
  }) {
    try {
      this.logger.log(`Fetching e-Stat data: ${params.statsDataId}`);

      // 1. e-Stat APIからデータ取得
      const rawData = await this.eStatConnector.getStatsData({
        statsDataId: params.statsDataId,
      });

      // 2. データ正規化
      const normalized = this.normalizeService.normalizeEStatData(rawData);

      // 3. 指標計算
      const metrics = this.metricsService.calculateAllMetrics(normalized.values);

      // 4. グラフ生成
      const title =
        params.title ||
        rawData.GET_STATS_DATA?.STATISTICAL_DATA?.TABLE_INF?.TITLE?.$ ||
        '統計データ';

      const chartBuffer = await this.chartsService.renderLineChart({
        title,
        labels: normalized.labels,
        data: normalized.values,
        xLabel: '年',
        yLabel: '値',
        footer: `出典: e-Stat (${params.statsDataId})`,
      });

      // 5. 画像保存
      const chartFilename = `chart_estat_${Date.now()}.png`;
      const chartPath = join(process.cwd(), 'uploads', 'charts', chartFilename);
      writeFileSync(chartPath, chartBuffer);

      // 6. AI説明文生成
      const explanation = await this.openaiProvider.generateExplanation({
        title,
        dataPoints: normalized.labels.map((label, i) => ({
          year: label,
          value: normalized.values[i],
        })),
      });

      return {
        data: normalized,
        metrics,
        chartUrl: `/uploads/charts/${chartFilename}`,
        explanation,
        source: {
          type: 'e-Stat',
          statsDataId: params.statsDataId,
          url: `https://www.e-stat.go.jp/stat-search/files?stat_infid=${params.statsDataId}`,
          fetchedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`e-Stat data fetch failed: ${error.message}`);
      throw new Error(`e-Stat data fetch failed: ${error.message}`);
    }
  }

  /**
   * RESASデータ取得と分析
   *
   * @param params.prefCode - 都道府県コード
   * @param params.dataType - データ種別（population, industry）
   * @param params.title - グラフタイトル
   */
  async fetchResasData(params: {
    prefCode: string;
    dataType: 'population' | 'industry';
    title?: string;
  }) {
    try {
      this.logger.log(
        `Fetching RESAS data: prefCode=${params.prefCode}, type=${params.dataType}`,
      );

      let rawData: any;
      let normalized: { labels: any[]; values: number[] };

      // 1. RESAS APIからデータ取得
      if (params.dataType === 'population') {
        rawData = await this.resasConnector.getPopulationComposition({
          prefCode: params.prefCode,
        });
        normalized = this.normalizeService.normalizeResasData(rawData, '総人口');
      } else {
        rawData = await this.resasConnector.getIndustryStructure({
          prefCode: params.prefCode,
        });
        // 産業データは構造が異なるため別処理
        const industries = rawData.result || [];
        normalized = {
          labels: industries.map((i: any) => i.simcName),
          values: industries.map((i: any) => i.addedValue),
        };
      }

      // 2. 指標計算
      const metrics = this.metricsService.calculateAllMetrics(normalized.values);

      // 3. グラフ生成
      const title = params.title || `RESAS ${params.dataType} データ`;
      const chartBuffer = await this.chartsService.renderLineChart({
        title,
        labels: normalized.labels,
        data: normalized.values,
        xLabel: params.dataType === 'population' ? '年' : '業種',
        yLabel: params.dataType === 'population' ? '人口' : '付加価値額',
        footer: `出典: RESAS (都道府県コード: ${params.prefCode})`,
      });

      // 4. 画像保存
      const chartFilename = `chart_resas_${Date.now()}.png`;
      const chartPath = join(process.cwd(), 'uploads', 'charts', chartFilename);
      writeFileSync(chartPath, chartBuffer);

      // 5. AI説明文生成
      const explanation = await this.openaiProvider.generateExplanation({
        title,
        dataPoints: normalized.labels.map((label, i) => ({
          label,
          value: normalized.values[i],
        })),
      });

      return {
        data: normalized,
        metrics,
        chartUrl: `/uploads/charts/${chartFilename}`,
        explanation,
        source: {
          type: 'RESAS',
          prefCode: params.prefCode,
          dataType: params.dataType,
          url: 'https://resas.go.jp/',
          fetchedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`RESAS data fetch failed: ${error.message}`);
      throw new Error(`RESAS data fetch failed: ${error.message}`);
    }
  }

  /**
   * 統計表リスト検索（e-Stat）
   */
  async searchEStatTables(params: { searchWord: string; surveyYears?: string }) {
    try {
      const result = await this.eStatConnector.getStatsList({
        searchWord: params.searchWord,
        surveyYears: params.surveyYears,
      });

      const tables =
        result.GET_STATS_LIST?.DATA_LIST?.TABLE_INF?.map((table: any) => ({
          id: table['@id'],
          title: table.TITLE?.$,
          statName: table.STAT_NAME?.$,
          govOrg: table.GOV_ORG?.$,
          surveyDate: table.SURVEY_DATE,
        })) || [];

      return {
        total: tables.length,
        tables,
      };
    } catch (error) {
      this.logger.error(`e-Stat search failed: ${error.message}`);
      throw new Error(`e-Stat search failed: ${error.message}`);
    }
  }

  /**
   * 都道府県一覧取得（RESAS）
   */
  async getResasPrefectures() {
    try {
      const result = await this.resasConnector.getPrefectures();
      return result.result || [];
    } catch (error) {
      this.logger.error(`RESAS prefectures fetch failed: ${error.message}`);
      throw new Error(`RESAS prefectures fetch failed: ${error.message}`);
    }
  }
}
