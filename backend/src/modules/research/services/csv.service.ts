import { Injectable } from '@nestjs/common';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

@Injectable()
export class CsvService {
  /**
   * CSVファイルを解析してJSONに変換
   */
  async parse(filePath: string): Promise<any[]> {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * データを正規化（ラベルと値を分離）
   */
  normalize(data: any[]): { labels: any[]; values: number[] } {
    if (data.length === 0) {
      throw new Error('CSV data is empty');
    }

    // 最初の列をラベル、2列目を値として抽出
    const keys = Object.keys(data[0]);
    if (keys.length < 2) {
      throw new Error('CSV must have at least 2 columns');
    }

    const labels = data.map((row) => row[keys[0]]);
    const values = data.map((row) => {
      const value = parseFloat(row[keys[1]]);
      if (isNaN(value)) {
        throw new Error(`Invalid numeric value: ${row[keys[1]]}`);
      }
      return value;
    });

    return { labels, values };
  }
}