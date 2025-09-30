import { Injectable, HttpException, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * RESAS API Connector
 *
 * 地域経済分析システム（RESAS）APIからデータを取得
 *
 * モック機能:
 * - RESAS_API_KEYが未設定または'mock'の場合、モックデータを返す
 * - 実際のAPIキー取得後、環境変数を設定するだけで本番APIに切り替わる
 *
 * 使用方法:
 * 1. モード: RESAS_API_KEY='mock' または未設定 → モックデータ
 * 2. 本番: RESAS_API_KEY='実際のAPIキー' → RESAS API呼び出し
 */
@Injectable()
export class ResasConnector {
  private readonly logger = new Logger(ResasConnector.name);
  private readonly baseUrl = 'https://opendata.resas-portal.go.jp/api/v1';
  private readonly apiKey = process.env.RESAS_API_KEY;
  private readonly useMock = !this.apiKey || this.apiKey === 'mock';

  constructor() {
    if (this.useMock) {
      this.logger.warn(
        '⚠️  RESAS API is running in MOCK mode. Set RESAS_API_KEY to use real API.',
      );
    } else {
      this.logger.log('✅ RESAS API configured with API key');
    }
  }

  /**
   * 都道府県一覧取得
   *
   * @returns 都道府県リスト
   */
  async getPrefectures(): Promise<any> {
    if (this.useMock) {
      return this.getMockPrefectures();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/prefectures`, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`RESAS API error: ${error.message}`);
      throw new HttpException(
        `RESAS API error: ${error.message}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * 人口構成データ取得
   *
   * @param params.prefCode - 都道府県コード（1-47）
   * @param params.cityCode - 市区町村コード（オプション）
   * @returns 人口データ
   */
  async getPopulationComposition(params: {
    prefCode: string;
    cityCode?: string;
  }): Promise<any> {
    if (this.useMock) {
      return this.getMockPopulationComposition(params.prefCode);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/population/composition/perYear`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
          },
          params: {
            prefCode: params.prefCode,
            cityCode: params.cityCode,
          },
          timeout: 10000,
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`RESAS API error: ${error.message}`);
      throw new HttpException(
        `RESAS API error: ${error.message}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * 産業構造データ取得
   *
   * @param params.prefCode - 都道府県コード
   * @param params.cityCode - 市区町村コード（オプション）
   * @param params.simcCode - 産業分類コード（オプション）
   * @returns 産業データ
   */
  async getIndustryStructure(params: {
    prefCode: string;
    cityCode?: string;
    simcCode?: string;
  }): Promise<any> {
    if (this.useMock) {
      return this.getMockIndustryStructure(params.prefCode);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/industry/power/forArea`, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
        params: {
          prefCode: params.prefCode,
          cityCode: params.cityCode,
          simcCode: params.simcCode,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`RESAS API error: ${error.message}`);
      throw new HttpException(
        `RESAS API error: ${error.message}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * モック: 都道府県一覧
   */
  private getMockPrefectures(): any {
    this.logger.debug('[MOCK] getPrefectures called');

    return {
      message: null,
      result: [
        { prefCode: 1, prefName: '北海道' },
        { prefCode: 13, prefName: '東京都' },
        { prefCode: 14, prefName: '神奈川県' },
        { prefCode: 23, prefName: '愛知県' },
        { prefCode: 27, prefName: '大阪府' },
        { prefCode: 40, prefName: '福岡県' },
      ],
    };
  }

  /**
   * モック: 人口構成データ
   */
  private getMockPopulationComposition(prefCode: string): any {
    this.logger.debug(`[MOCK] getPopulationComposition called with prefCode: ${prefCode}`);

    const populations = {
      '13': {
        // 東京都
        name: '東京都',
        data: [
          { year: 2010, value: 13159000 },
          { year: 2015, value: 13515000 },
          { year: 2020, value: 13921000 },
          { year: 2025, value: 14036000 },
        ],
      },
      '27': {
        // 大阪府
        name: '大阪府',
        data: [
          { year: 2010, value: 8863000 },
          { year: 2015, value: 8837000 },
          { year: 2020, value: 8809000 },
          { year: 2025, value: 8762000 },
        ],
      },
    };

    const prefData = populations[prefCode] || {
      name: 'サンプル県',
      data: [
        { year: 2010, value: 5000000 },
        { year: 2015, value: 5100000 },
        { year: 2020, value: 5200000 },
        { year: 2025, value: 5300000 },
      ],
    };

    return {
      message: null,
      result: {
        boundaryYear: 2020,
        data: [
          {
            label: '総人口',
            data: prefData.data,
          },
          {
            label: '年少人口',
            data: prefData.data.map((d) => ({
              year: d.year,
              value: Math.floor(d.value * 0.12),
            })),
          },
          {
            label: '生産年齢人口',
            data: prefData.data.map((d) => ({
              year: d.year,
              value: Math.floor(d.value * 0.6),
            })),
          },
          {
            label: '老年人口',
            data: prefData.data.map((d) => ({
              year: d.year,
              value: Math.floor(d.value * 0.28),
            })),
          },
        ],
      },
    };
  }

  /**
   * モック: 産業構造データ
   */
  private getMockIndustryStructure(prefCode: string): any {
    this.logger.debug(`[MOCK] getIndustryStructure called with prefCode: ${prefCode}`);

    return {
      message: null,
      result: [
        {
          year: 2016,
          prefCode: prefCode,
          simcName: '小売業',
          employeeNum: 850000,
          addedValue: 12500000,
        },
        {
          year: 2016,
          prefCode: prefCode,
          simcName: '卸売業',
          employeeNum: 620000,
          addedValue: 18000000,
        },
        {
          year: 2016,
          prefCode: prefCode,
          simcName: '情報通信業',
          employeeNum: 450000,
          addedValue: 22000000,
        },
        {
          year: 2016,
          prefCode: prefCode,
          simcName: '製造業',
          employeeNum: 1200000,
          addedValue: 35000000,
        },
      ],
    };
  }

  /**
   * モードチェック（デバッグ用）
   */
  isMockMode(): boolean {
    return this.useMock;
  }
}