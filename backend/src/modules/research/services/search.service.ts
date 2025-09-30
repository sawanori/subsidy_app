import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@/common/exceptions/app-error.codes';

/**
 * 検索サービス
 * APP-329: Bing or Google CSE クライアント実装
 */
@Injectable()
export class SearchService {
  private readonly searchProvider: 'bing' | 'google';
  private readonly apiKey: string;
  private readonly searchEngineId: string; // Google CSE用
  private readonly maxResultsPerQuery = 10;
  private readonly quotaPerDay = 100;
  private dailyUsage = 0;
  private lastResetDate: Date;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // 設定から検索プロバイダを選択
    this.searchProvider = this.configService.get('SEARCH_PROVIDER', 'bing');
    this.apiKey = this.configService.get('SEARCH_API_KEY', '');
    this.searchEngineId = this.configService.get('GOOGLE_CSE_ID', '');
    this.lastResetDate = new Date();
  }

  /**
   * Web検索実行
   */
  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult> {
    // クォータチェック
    this.checkQuota();

    try {
      if (this.searchProvider === 'bing') {
        return await this.searchBing(query, options);
      } else {
        return await this.searchGoogle(query, options);
      }
    } catch (error) {
      throw new BadRequestException({
        code: ErrorCode.ERR_RESEARCH_TIMEOUT,
        message: `Search failed: ${error.message}`,
      });
    } finally {
      this.dailyUsage++;
    }
  }

  /**
   * Bing Search API
   */
  private async searchBing(
    query: string,
    options: SearchOptions,
  ): Promise<SearchResult> {
    const url = 'https://api.cognitive.microsoft.com/bing/v7.0/search';
    const params = {
      q: query,
      count: options.limit || this.maxResultsPerQuery,
      offset: options.offset || 0,
      mkt: options.locale || 'ja-JP',
      safeSearch: 'Moderate',
    };

    if (options.site) {
      params.q = `site:${options.site} ${query}`;
    }

    const response = await firstValueFrom(
      this.httpService.get(url, {
        params,
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      }),
    );

    return this.parseBingResults(response.data);
  }

  /**
   * Google Custom Search API
   */
  private async searchGoogle(
    query: string,
    options: SearchOptions,
  ): Promise<SearchResult> {
    const url = 'https://www.googleapis.com/customsearch/v1';
    const params = {
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query,
      num: options.limit || this.maxResultsPerQuery,
      start: (options.offset || 0) + 1, // Google uses 1-indexed
      hl: options.locale || 'ja',
      safe: 'active',
    };

    if (options.site) {
      params.q = `site:${options.site} ${query}`;
    }

    if (options.dateRestrict) {
      params['dateRestrict'] = options.dateRestrict; // e.g., 'd7' for last 7 days
    }

    const response = await firstValueFrom(
      this.httpService.get(url, { params }),
    );

    return this.parseGoogleResults(response.data);
  }

  /**
   * Bing結果パース
   */
  private parseBingResults(data: any): SearchResult {
    const items: SearchResultItem[] = [];

    if (data.webPages && data.webPages.value) {
      data.webPages.value.forEach((page: any) => {
        items.push({
          title: page.name,
          url: page.url,
          snippet: page.snippet,
          displayUrl: page.displayUrl,
          datePublished: page.dateLastCrawled,
          language: page.language || 'ja',
        });
      });
    }

    return {
      query: data.queryContext?.originalQuery || '',
      totalResults: data.webPages?.totalEstimatedMatches || 0,
      items,
      searchTime: Date.now(),
      provider: 'bing',
    };
  }

  /**
   * Google結果パース
   */
  private parseGoogleResults(data: any): SearchResult {
    const items: SearchResultItem[] = [];

    if (data.items) {
      data.items.forEach((item: any) => {
        items.push({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          displayUrl: item.displayLink,
          datePublished: item.pagemap?.metatags?.[0]?.['article:published_time'],
          language: item.pagemap?.metatags?.[0]?.['og:locale'] || 'ja',
        });
      });
    }

    return {
      query: data.queries?.request?.[0]?.searchTerms || '',
      totalResults: parseInt(data.searchInformation?.totalResults || '0'),
      items,
      searchTime: Date.now(),
      provider: 'google',
    };
  }

  /**
   * クォータチェック
   */
  private checkQuota(): void {
    const now = new Date();
    if (now.toDateString() !== this.lastResetDate.toDateString()) {
      // 日付が変わったらリセット
      this.dailyUsage = 0;
      this.lastResetDate = now;
    }

    if (this.dailyUsage >= this.quotaPerDay) {
      throw new BadRequestException({
        code: ErrorCode.ERR_RESEARCH_QUOTA,
        message: `Daily search quota (${this.quotaPerDay}) exceeded`,
      });
    }
  }

  /**
   * 関連キーワード提案
   */
  async suggestKeywords(query: string): Promise<string[]> {
    // 簡易的なキーワード拡張
    const baseKeywords = query.split(/\s+/);
    const suggestions: string[] = [];

    // 補助金関連キーワード
    const subsidyKeywords = ['補助金', '助成金', '交付金', '支援金', '制度'];
    const businessKeywords = ['事業', '企業', '中小企業', '個人事業主'];

    // キーワード組み合わせ
    baseKeywords.forEach((keyword) => {
      subsidyKeywords.forEach((subsidyKeyword) => {
        if (!query.includes(subsidyKeyword)) {
          suggestions.push(`${keyword} ${subsidyKeyword}`);
        }
      });
    });

    return suggestions.slice(0, 5); // 上位5件
  }
}

// 型定義
export interface SearchOptions {
  limit?: number;
  offset?: number;
  locale?: string;
  site?: string; // サイト内検索
  dateRestrict?: string; // 日付制限 (e.g., 'd7', 'm1', 'y1')
  fileType?: string; // ファイルタイプ制限
}

export interface SearchResult {
  query: string;
  totalResults: number;
  items: SearchResultItem[];
  searchTime: number;
  provider: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  displayUrl: string;
  datePublished?: string;
  language?: string;
  metadata?: Record<string, any>;
}