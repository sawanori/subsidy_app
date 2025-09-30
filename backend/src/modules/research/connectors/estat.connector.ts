import { Injectable, HttpException, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * e-Stat API Connector
 *
 * 政府統計の総合窓口（e-Stat）APIからデータを取得
 *
 * モック機能:
 * - ESTAT_APP_IDが未設定または'mock'の場合、モックデータを返す
 * - 実際のAPIキー取得後、環境変数を設定するだけで本番APIに切り替わる
 *
 * 使用方法:
 * 1. モード: ESTAT_APP_ID='mock' または未設定 → モックデータ
 * 2. 本番: ESTAT_APP_ID='実際のアプリケーションID' → e-Stat API呼び出し
 */
@Injectable()
export class EStatConnector {
  private readonly logger = new Logger(EStatConnector.name);
  private readonly baseUrl = 'https://api.e-stat.go.jp/rest/3.0/app/json';
  private readonly appId = process.env.ESTAT_APP_ID;
  private readonly useMock = !this.appId || this.appId === 'mock';

  constructor() {
    if (this.useMock) {
      this.logger.warn(
        '⚠️  e-Stat API is running in MOCK mode. Set ESTAT_APP_ID to use real API.',
      );
    } else {
      this.logger.log('✅ e-Stat API configured with appId');
    }
  }

  /**
   * 統計データ取得
   *
   * @param params.statsDataId - 統計表ID
   * @param params.cdCat01 - 分類コード（オプション）
   * @param params.cdTime - 時間軸コード（オプション）
   * @returns 統計データ
   */
  async getStatsData(params: {
    statsDataId: string;
    cdCat01?: string;
    cdTime?: string;
  }): Promise<any> {
    if (this.useMock) {
      return this.getMockStatsData(params.statsDataId);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/getStatsData`, {
        params: {
          appId: this.appId,
          statsDataId: params.statsDataId,
          cdCat01: params.cdCat01,
          cdTime: params.cdTime,
          metaGetFlg: 'Y',
        },
        timeout: 10000,
      });

      if (response.data?.GET_STATS_DATA?.RESULT?.STATUS !== 0) {
        throw new Error(
          response.data?.GET_STATS_DATA?.RESULT?.ERROR_MSG || 'e-Stat API error',
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`e-Stat API error: ${error.message}`);
      throw new HttpException(
        `e-Stat API error: ${error.message}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * 統計表リスト取得
   *
   * @param params.surveyYears - 調査年（オプション）
   * @param params.searchWord - 検索キーワード（オプション）
   * @returns 統計表リスト
   */
  async getStatsList(params: {
    surveyYears?: string;
    searchWord?: string;
  }): Promise<any> {
    if (this.useMock) {
      return this.getMockStatsList(params.searchWord);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/getStatsList`, {
        params: {
          appId: this.appId,
          surveyYears: params.surveyYears,
          searchWord: params.searchWord,
        },
        timeout: 10000,
      });

      if (response.data?.GET_STATS_LIST?.RESULT?.STATUS !== 0) {
        throw new Error(
          response.data?.GET_STATS_LIST?.RESULT?.ERROR_MSG || 'e-Stat API error',
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`e-Stat API error: ${error.message}`);
      throw new HttpException(
        `e-Stat API error: ${error.message}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * モック: 統計データ
   *
   * EC市場規模推移のサンプルデータ
   */
  private getMockStatsData(statsDataId: string): any {
    this.logger.debug(`[MOCK] getStatsData called with statsDataId: ${statsDataId}`);

    return {
      GET_STATS_DATA: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: 'MOCK: 正常に終了しました。',
          DATE: new Date().toISOString(),
        },
        PARAMETER: {
          STATS_DATA_ID: statsDataId,
        },
        STATISTICAL_DATA: {
          TABLE_INF: {
            STAT_NAME: {
              $: 'MOCK: 電子商取引に関する市場調査',
              '@code': '00200544',
            },
            GOV_ORG: {
              $: 'MOCK: 経済産業省',
              '@code': '00200',
            },
            TITLE: {
              $: 'MOCK: BtoC-EC市場規模推移',
            },
          },
          DATA_INF: {
            VALUE: [
              { '@time': '2019', '@unit': '兆円', $: '19.4' },
              { '@time': '2020', '@unit': '兆円', $: '22.0' },
              { '@time': '2021', '@unit': '兆円', $: '24.0' },
              { '@time': '2022', '@unit': '兆円', $: '25.5' },
              { '@time': '2023', '@unit': '兆円', $: '26.3' },
              { '@time': '2024', '@unit': '兆円', $: '27.8' },
            ],
          },
        },
      },
    };
  }

  /**
   * モック: 統計表リスト
   */
  private getMockStatsList(searchWord?: string): any {
    this.logger.debug(`[MOCK] getStatsList called with searchWord: ${searchWord}`);

    return {
      GET_STATS_LIST: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: 'MOCK: 正常に終了しました。',
          DATE: new Date().toISOString(),
        },
        DATA_LIST: {
          TABLE_INF: [
            {
              '@id': '0003411111',
              STAT_NAME: { $: 'MOCK: 電子商取引に関する市場調査' },
              GOV_ORG: { $: 'MOCK: 経済産業省' },
              STATISTICS_NAME: 'MOCK: BtoC-EC市場規模推移',
              TITLE: { $: 'MOCK: 物販系分野の市場規模' },
              SURVEY_DATE: '202410',
            },
            {
              '@id': '0003411112',
              STAT_NAME: { $: 'MOCK: 経済センサス-活動調査' },
              GOV_ORG: { $: 'MOCK: 総務省統計局' },
              STATISTICS_NAME: 'MOCK: 産業別売上高',
              TITLE: { $: 'MOCK: 小売業の売上推移' },
              SURVEY_DATE: '202406',
            },
          ],
        },
      },
    };
  }

  /**
   * モードチェック（デバッグ用）
   */
  isMockMode(): boolean {
    return this.useMock;
  }
}