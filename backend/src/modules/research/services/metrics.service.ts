import { Injectable } from '@nestjs/common';

/**
 * 指標計算サービス
 *
 * CAGR、YoY、移動平均などの統計指標を計算
 */
@Injectable()
export class MetricsService {
  /**
   * CAGR（年平均成長率）計算
   *
   * CAGR = ((終値 / 始値) ^ (1 / 年数)) - 1
   *
   * @param startValue - 開始時の値
   * @param endValue - 終了時の値
   * @param years - 期間（年）
   * @returns CAGR（パーセンテージ）
   *
   * @example
   * calculateCAGR(19.4, 27.8, 5) // => 7.5% (2019年19.4兆円 → 2024年27.8兆円)
   */
  calculateCAGR(startValue: number, endValue: number, years: number): number {
    if (startValue <= 0 || endValue <= 0 || years <= 0) {
      throw new Error('Invalid values for CAGR calculation');
    }

    const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
    return parseFloat(cagr.toFixed(2));
  }

  /**
   * YoY（前年比）計算
   *
   * YoY = ((今年の値 - 昨年の値) / 昨年の値) × 100
   *
   * @param values - 時系列データ配列
   * @returns YoY配列（初年度は0）
   *
   * @example
   * calculateYoY([19.4, 22.0, 24.0]) // => [0, 13.4, 9.1]
   */
  calculateYoY(values: number[]): number[] {
    if (!values || values.length === 0) {
      return [];
    }

    const result: number[] = [0]; // 初年度は0%

    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] === 0) {
        result.push(0);
      } else {
        const yoy = ((values[i] - values[i - 1]) / values[i - 1]) * 100;
        result.push(parseFloat(yoy.toFixed(2)));
      }
    }

    return result;
  }

  /**
   * 移動平均計算
   *
   * @param values - 値配列
   * @param window - ウィンドウサイズ（例: 3期移動平均なら3）
   * @returns 移動平均配列
   *
   * @example
   * calculateMovingAverage([10, 12, 15, 14, 16], 3)
   * // => [null, null, 12.33, 13.67, 15]
   */
  calculateMovingAverage(values: number[], window: number): (number | null)[] {
    if (window <= 0 || window > values.length) {
      throw new Error('Invalid window size');
    }

    const result: (number | null)[] = [];

    for (let i = 0; i < values.length; i++) {
      if (i < window - 1) {
        result.push(null);
      } else {
        const sum = values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(parseFloat((sum / window).toFixed(2)));
      }
    }

    return result;
  }

  /**
   * 指数化（基準年=100）
   *
   * @param values - 値配列
   * @param baseIndex - 基準年のインデックス（デフォルト: 0）
   * @returns 指数化された配列
   *
   * @example
   * indexize([19.4, 22.0, 24.0], 0)
   * // => [100, 113.4, 123.7] (2019年を100とした場合)
   */
  indexize(values: number[], baseIndex: number = 0): number[] {
    if (baseIndex < 0 || baseIndex >= values.length) {
      throw new Error('Invalid base index');
    }

    const baseValue = values[baseIndex];

    if (baseValue === 0) {
      throw new Error('Base value cannot be zero');
    }

    return values.map((v) => parseFloat(((v / baseValue) * 100).toFixed(2)));
  }

  /**
   * 標準偏差計算
   *
   * @param values - 値配列
   * @returns 標準偏差
   */
  calculateStdDev(values: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return parseFloat(Math.sqrt(variance).toFixed(2));
  }

  /**
   * 平均値計算
   *
   * @param values - 値配列
   * @returns 平均値
   */
  calculateMean(values: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return parseFloat((sum / values.length).toFixed(2));
  }

  /**
   * 中央値計算
   *
   * @param values - 値配列
   * @returns 中央値
   */
  calculateMedian(values: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
    } else {
      return sorted[mid];
    }
  }

  /**
   * 最大値
   */
  calculateMax(values: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }
    return Math.max(...values);
  }

  /**
   * 最小値
   */
  calculateMin(values: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }
    return Math.min(...values);
  }

  /**
   * 合計値
   */
  calculateSum(values: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }
    return parseFloat(values.reduce((a, b) => a + b, 0).toFixed(2));
  }

  /**
   * 成長率（始値→終値）
   *
   * @param startValue - 開始時の値
   * @param endValue - 終了時の値
   * @returns 成長率（パーセンテージ）
   */
  calculateGrowthRate(startValue: number, endValue: number): number {
    if (startValue === 0) {
      throw new Error('Start value cannot be zero');
    }

    const rate = ((endValue - startValue) / startValue) * 100;
    return parseFloat(rate.toFixed(2));
  }

  /**
   * トレンド判定（上昇/下降/横ばい）
   *
   * @param values - 値配列
   * @param threshold - 閾値（デフォルト: 5%）
   * @returns トレンド ('increasing' | 'decreasing' | 'stable')
   */
  detectTrend(
    values: number[],
    threshold: number = 5,
  ): 'increasing' | 'decreasing' | 'stable' {
    if (!values || values.length < 2) {
      return 'stable';
    }

    const growthRate = this.calculateGrowthRate(values[0], values[values.length - 1]);

    if (growthRate > threshold) {
      return 'increasing';
    } else if (growthRate < -threshold) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * 変動係数（Coefficient of Variation）
   *
   * CV = (標準偏差 / 平均値) × 100
   *
   * @param values - 値配列
   * @returns 変動係数（パーセンテージ）
   */
  calculateCV(values: number[]): number {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values);

    if (mean === 0) {
      return 0;
    }

    return parseFloat(((stdDev / mean) * 100).toFixed(2));
  }

  /**
   * 複数指標を一括計算
   *
   * @param values - 値配列
   * @returns 主要指標のオブジェクト
   */
  calculateAllMetrics(values: number[]): {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    sum: number;
    cagr: number | null;
    yoy: number[];
    trend: 'increasing' | 'decreasing' | 'stable';
    cv: number;
  } {
    const years = values.length - 1;

    return {
      mean: this.calculateMean(values),
      median: this.calculateMedian(values),
      stdDev: this.calculateStdDev(values),
      min: this.calculateMin(values),
      max: this.calculateMax(values),
      sum: this.calculateSum(values),
      cagr: years > 0 ? this.calculateCAGR(values[0], values[values.length - 1], years) : null,
      yoy: this.calculateYoY(values),
      trend: this.detectTrend(values),
      cv: this.calculateCV(values),
    };
  }
}