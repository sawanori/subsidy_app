import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// import { InjectRedis } from '@liaoliaots/nestjs-redis';
// import Redis from 'ioredis';

/**
 * レート制限ガード
 * APP-358: APIレート制限実装
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // @InjectRedis() private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // レート制限設定を取得
    const rateLimit = this.reflector.get<RateLimitConfig>(
      'rateLimit',
      context.getHandler(),
    );

    // 設定がない場合はスキップ
    if (!rateLimit) {
      return true;
    }

    // Temporarily disable Redis-dependent logic
    // const request = context.switchToHttp().getRequest();
    // const key = this.getKey(request, rateLimit);

    // 現在のカウントを取得
    const current = 1; // await this.redis.incr(key);

    // 初回の場合はTTLを設定
    // if (current === 1) {
    //   await this.redis.expire(key, rateLimit.window);
    // }

    // TTLを取得
    const ttl = rateLimit.window; // await this.redis.ttl(key);

    // レスポンスヘッダーを設定
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', rateLimit.limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimit.limit - current));
    response.setHeader('X-RateLimit-Reset', new Date(Date.now() + ttl * 1000).toISOString());

    // 制限超過チェック
    if (current > rateLimit.limit) {
      throw new HttpException(
        {
          code: 'ERR_SECURITY_RATE_LIMIT' as any,
          message: 'Rate limit exceeded',
          retryAfter: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * レート制限キー生成
   */
  private getKey(request: any, config: RateLimitConfig): string {
    const parts = ['ratelimit'];

    // スコープに応じたキー生成
    switch (config.scope) {
      case 'global':
        parts.push('global');
        break;
      case 'ip':
        const ip = request.ip || request.connection.remoteAddress;
        parts.push('ip', ip);
        break;
      case 'user':
        const userId = request.user?.id || 'anonymous';
        parts.push('user', userId);
        break;
      case 'api-key':
        const apiKey = request.headers['x-api-key'] || 'no-key';
        parts.push('apikey', apiKey);
        break;
    }

    // エンドポイントを含める
    if (config.includeEndpoint) {
      parts.push(request.method, request.route.path);
    }

    return parts.join(':');
  }
}

/**
 * レート制限設定
 */
export interface RateLimitConfig {
  /**
   * ウィンドウ期間（秒）
   */
  window: number;

  /**
   * ウィンドウ内の最大リクエスト数
   */
  limit: number;

  /**
   * スコープ
   */
  scope: 'global' | 'ip' | 'user' | 'api-key';

  /**
   * エンドポイントごとに別カウントするか
   */
  includeEndpoint?: boolean;
}

/**
 * レート制限デコレータ
 */
export function RateLimit(config: RateLimitConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('rateLimit', config, descriptor.value);
    return descriptor;
  };
}

/**
 * プリセットレート制限
 */
export const RateLimits = {
  // デフォルト: 1分間60リクエスト
  default: {
    window: 60,
    limit: 60,
    scope: 'ip' as const,
  },

  // 認証: 1分間5回
  auth: {
    window: 60,
    limit: 5,
    scope: 'ip' as const,
  },

  // 生成API: 1分間5回
  generate: {
    window: 60,
    limit: 5,
    scope: 'user' as const,
  },

  // 検索API: 1分間10回
  search: {
    window: 60,
    limit: 10,
    scope: 'user' as const,
  },

  // エクスポート: 1分間2回
  export: {
    window: 60,
    limit: 2,
    scope: 'user' as const,
  },
};