import { ErrorResponse } from './types';

interface ApiClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  idempotencyKey?: string;
  retry?: {
    attempts?: number;
    delay?: number;
    backoff?: boolean;
  };
}

class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, status: number, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private authToken?: string;

  constructor(config: ApiClientConfig = {}) {
    // Next.js のリバースプロキシを使用するため、/api プレフィックスを追加
    this.baseURL = config.baseURL || process.env.NEXT_PUBLIC_API_URL || '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.timeout = config.timeout || 30000;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = undefined;
  }

  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async retryRequest(
    url: string,
    options: RequestOptions,
    retryConfig: RequestOptions['retry']
  ): Promise<Response> {
    const maxAttempts = retryConfig?.attempts || 3;
    const baseDelay = retryConfig?.delay || 1000;
    const useBackoff = retryConfig?.backoff !== false;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(url, options);

        // 5xx エラーの場合はリトライ
        if (response.status >= 500 && attempt < maxAttempts - 1) {
          throw new Error(`Server error: ${response.status}`);
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts - 1) {
          const delay = useBackoff ? baseDelay * Math.pow(2, attempt) : baseDelay;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // ヘッダーの構築
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    // multipart(FormData)の場合はContent-Typeを外す（ブラウザが境界を含め自動設定）
    const isFormData =
      typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (isFormData && 'Content-Type' in headers) {
      delete headers['Content-Type'];
    }

    // 認証トークンの追加
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Idempotency-Keyの追加（POST/PUT/PATCHの場合）
    const method = options.method?.toUpperCase();
    if (['POST', 'PUT', 'PATCH'].includes(method || '')) {
      const idempotencyKey = options.idempotencyKey || this.generateIdempotencyKey();
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    const requestOptions: RequestOptions = {
      ...options,
      headers,
    };

    try {
      // タイムアウト付きリクエスト
      const timeoutMs = options.timeout || this.timeout;
      const fetchPromise = options.retry
        ? this.retryRequest(url, requestOptions, options.retry)
        : fetch(url, requestOptions);

      const response = await this.withTimeout(fetchPromise, timeoutMs);

      // エラーレスポンスの処理
      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          error: {
            code: 'UNKNOWN_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
          timestamp: new Date().toISOString(),
          path: endpoint,
        }));

        throw new ApiError(
          errorData.error.message,
          response.status,
          errorData.error.code,
          errorData.error.details
        );
      }

      // 204 No Content の場合
      if (response.status === 204) {
        return undefined as any;
      }

      // JSONレスポンスのパース
      const data = await response.json();
      return data as T;
    } catch (error) {
      // ApiErrorの場合はそのまま投げる
      if (error instanceof ApiError) {
        throw error;
      }

      // その他のエラー（詳細情報を含める）
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[API Client Error]', {
        url,
        method: options.method,
        error: errorMessage,
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new ApiError(
        `${errorMessage} (URL: ${endpoint})`,
        0,
        'NETWORK_ERROR',
        { originalError: errorMessage }
      );
    }
  }

  // 便利メソッド
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    // FormDataの場合はそのまま、それ以外はJSON.stringify
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // ファイルアップロード用
  async uploadFile<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>,
    options?: RequestOptions
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    // Content-Typeヘッダーを削除（ブラウザが自動設定）
    const headers = { ...options?.headers };
    delete headers['Content-Type'];

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
    });
  }

  // ジョブステータスのポーリング
  async pollJobStatus(
    jobId: string,
    onProgress?: (progress: number) => void,
    pollInterval = 1000,
    maxAttempts = 60
  ): Promise<any> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await this.get(`/jobs/${jobId}`);

      if (onProgress && typeof response.progress === 'number') {
        onProgress(response.progress);
      }

      if (response.status === 'succeeded') {
        if (response.result_url) {
          // 結果URLから実際のデータを取得
          return await this.get(response.result_url);
        }
        return response;
      }

      if (response.status === 'failed') {
        throw new ApiError('Job failed', 500, 'JOB_FAILED', response);
      }

      await this.sleep(pollInterval);
      attempts++;
    }

    throw new ApiError('Job polling timeout', 504, 'JOB_TIMEOUT');
  }
}

// シングルトンインスタンス
const apiClient = new ApiClient();

export { apiClient, ApiClient, ApiError };
export default apiClient;
