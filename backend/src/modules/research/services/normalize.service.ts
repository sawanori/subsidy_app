import { Injectable } from '@nestjs/common';

/**
 * データ正規化サービス
 *
 * 異なるソース（e-Stat, RESAS, CSV）からのデータを統一フォーマットに変換
 */
@Injectable()
export class NormalizeService {
  /**
   * 時系列データの正規化（年次統一）
   *
   * @param data - 元データ配列
   * @param config - 設定
   * @param config.timeField - 時間フィールド名
   * @param config.valueField - 値フィールド名
   * @param config.timeUnit - 時間単位（yearly, quarterly, monthly）
   * @returns 正規化されたデータ { labels, values }
   */
  normalizeTimeSeries(
    data: any[],
    config: {
      timeField: string;
      valueField: string;
      timeUnit: 'yearly' | 'quarterly' | 'monthly';
    },
  ): { labels: any[]; values: number[] } {
    if (!data || data.length === 0) {
      throw new Error('Data is empty');
    }

    // 時系列順にソート
    const sorted = data.sort((a, b) => {
      const timeA = this.parseTime(a[config.timeField]);
      const timeB = this.parseTime(b[config.timeField]);
      return timeA.getTime() - timeB.getTime();
    });

    const labels = sorted.map((item) => {
      const date = this.parseTime(item[config.timeField]);
      return this.formatTime(date, config.timeUnit);
    });

    const values = sorted.map((item) => {
      const value = parseFloat(item[config.valueField]);
      if (isNaN(value)) {
        throw new Error(`Invalid numeric value: ${item[config.valueField]}`);
      }
      return value;
    });

    return { labels, values };
  }

  /**
   * 時間文字列をDateオブジェクトに変換
   */
  private parseTime(timeStr: string | number | Date): Date {
    if (timeStr instanceof Date) {
      return timeStr;
    }

    // 数値の場合は年として扱う
    if (typeof timeStr === 'number') {
      return new Date(timeStr, 0, 1);
    }

    // 文字列の場合
    const str = String(timeStr);

    // YYYY形式
    if (/^\d{4}$/.test(str)) {
      return new Date(parseInt(str), 0, 1);
    }

    // YYYYMM形式
    if (/^\d{6}$/.test(str)) {
      const year = parseInt(str.substring(0, 4));
      const month = parseInt(str.substring(4, 6)) - 1;
      return new Date(year, month, 1);
    }

    // ISO形式等
    return new Date(str);
  }

  /**
   * 時間を指定単位でフォーマット
   */
  private formatTime(date: Date, unit: 'yearly' | 'quarterly' | 'monthly'): string {
    const year = date.getFullYear();
    const month = date.getMonth();

    switch (unit) {
      case 'yearly':
        return year.toString();

      case 'quarterly':
        const quarter = Math.floor(month / 3) + 1;
        return `${year}Q${quarter}`;

      case 'monthly':
        return `${year}/${String(month + 1).padStart(2, '0')}`;

      default:
        return year.toString();
    }
  }

  /**
   * 単位変換
   *
   * @param value - 変換前の値
   * @param from - 変換前の単位
   * @param to - 変換後の単位
   * @returns 変換後の値
   */
  convertUnit(value: number, from: string, to: string): number {
    const conversions: { [key: string]: number } = {
      // 基本単位変換
      million_to_billion: 0.001,
      billion_to_million: 1000,
      thousand_to_million: 0.001,
      million_to_thousand: 1000,
      thousand_to_billion: 0.000001,
      billion_to_thousand: 1000000,

      // 日本の単位
      yen_to_thousand_yen: 0.001,
      yen_to_million_yen: 0.000001,
      yen_to_billion_yen: 0.000000001,
      thousand_yen_to_yen: 1000,
      thousand_yen_to_million_yen: 0.001,
      million_yen_to_yen: 1000000,
      million_yen_to_billion_yen: 0.001,
      billion_yen_to_yen: 1000000000,
      billion_yen_to_million_yen: 1000,

      // 兆円
      trillion_yen_to_billion_yen: 1000,
      billion_yen_to_trillion_yen: 0.001,
    };

    const key = `${from}_to_${to}`;
    const factor = conversions[key];

    if (factor === undefined) {
      // 変換が定義されていない場合は元の値を返す
      return value;
    }

    return value * factor;
  }

  /**
   * 欠損値補完（線形補間）
   *
   * @param values - 値配列（nullを含む可能性）
   * @returns 補完後の値配列
   */
  interpolateMissing(values: (number | null)[]): number[] {
    const result = [...values];

    for (let i = 0; i < result.length; i++) {
      if (result[i] === null || result[i] === undefined) {
        // 前後の値を見つける
        let prev: { index: number; value: number } | null = null;
        let next: { index: number; value: number } | null = null;

        // 前方探索
        for (let j = i - 1; j >= 0; j--) {
          if (result[j] !== null && result[j] !== undefined) {
            prev = { index: j, value: result[j] as number };
            break;
          }
        }

        // 後方探索
        for (let j = i + 1; j < result.length; j++) {
          if (result[j] !== null && result[j] !== undefined) {
            next = { index: j, value: result[j] as number };
            break;
          }
        }

        // 線形補間
        if (prev && next) {
          const ratio = (i - prev.index) / (next.index - prev.index);
          result[i] = prev.value + (next.value - prev.value) * ratio;
        } else if (prev) {
          // 後方がない場合は前方の値をコピー
          result[i] = prev.value;
        } else if (next) {
          // 前方がない場合は後方の値をコピー
          result[i] = next.value;
        } else {
          // 両方ない場合は0
          result[i] = 0;
        }
      }
    }

    return result as number[];
  }

  /**
   * データの平滑化（移動平均）
   *
   * @param values - 値配列
   * @param window - ウィンドウサイズ
   * @returns 平滑化された値配列
   */
  smooth(values: number[], window: number = 3): number[] {
    if (window <= 1) {
      return values;
    }

    const result: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(values.length, i + Math.ceil(window / 2));
      const slice = values.slice(start, end);
      const sum = slice.reduce((acc, val) => acc + val, 0);
      result.push(sum / slice.length);
    }

    return result;
  }

  /**
   * パーセンテージ変換
   *
   * @param value - 値
   * @param total - 合計値
   * @param decimals - 小数点以下の桁数（デフォルト: 1）
   * @returns パーセンテージ
   */
  toPercentage(value: number, total: number, decimals: number = 1): number {
    if (total === 0) {
      return 0;
    }
    const percentage = (value / total) * 100;
    return parseFloat(percentage.toFixed(decimals));
  }

  /**
   * 配列の正規化（0-1スケール）
   *
   * @param values - 値配列
   * @returns 正規化された値配列（0-1）
   */
  normalizeScale(values: number[]): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (max === min) {
      return values.map(() => 0.5);
    }

    return values.map((v) => (v - min) / (max - min));
  }

  /**
   * e-Stat APIレスポンスを正規化
   *
   * @param estatData - e-Stat APIレスポンス
   * @returns 正規化されたデータ
   */
  normalizeEStatData(estatData: any): { labels: any[]; values: number[] } {
    const values = estatData?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;

    if (!values || !Array.isArray(values)) {
      throw new Error('Invalid e-Stat data format');
    }

    return this.normalizeTimeSeries(values, {
      timeField: '@time',
      valueField: '$',
      timeUnit: 'yearly',
    });
  }

  /**
   * RESAS APIレスポンスを正規化
   *
   * @param resasData - RESAS APIレスポンス
   * @param dataLabel - データラベル（例: "総人口"）
   * @returns 正規化されたデータ
   */
  normalizeResasData(
    resasData: any,
    dataLabel: string = '総人口',
  ): { labels: any[]; values: number[] } {
    const datasets = resasData?.result?.data;

    if (!datasets || !Array.isArray(datasets)) {
      throw new Error('Invalid RESAS data format');
    }

    const target = datasets.find((d) => d.label === dataLabel);

    if (!target || !target.data) {
      throw new Error(`Data label not found: ${dataLabel}`);
    }

    const labels = target.data.map((d: any) => d.year);
    const values = target.data.map((d: any) => d.value);

    return { labels, values };
  }
}