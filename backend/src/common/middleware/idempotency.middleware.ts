import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// import { InjectRedis } from '@liaoliaots/nestjs-redis';
// import Redis from 'ioredis';
import * as crypto from 'crypto';

/**
 * 幂等性ミドルウェア
 * APP-371: Idempotency-Keyを使用した重複リクエスト制御
 */
@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly TTL = 86400; // 24時間
  private readonly LOCK_TTL = 30; // 30秒

  constructor(/* @InjectRedis() private readonly redis: Redis */) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Idempotency-Keyヘッダーをチェック
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const xIdempotencyKey = req.headers['x-idempotency-key'] as string;
    const key = idempotencyKey || xIdempotencyKey;

    // GETリクエストはスキップ
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    // キーがない場合は通常処理
    if (!key) {
      return next();
    }

    // キーのフォーマット検証 (UUIDまたは英数字)
    if (!/^[a-zA-Z0-9-_]{8,128}$/.test(key)) {
      return res.status(400).json({
        error: 'Invalid idempotency key format',
      });
    }

    const cacheKey = this.getCacheKey(key, req);
    const lockKey = `${cacheKey}:lock`;

    try {
      // 1. 既存の結果をチェック (Redis temporarily disabled)
      // const cached = await this.redis.get(cacheKey);
      // if (cached) {
      //   const result = JSON.parse(cached);
      //   // 同じレスポンスを返却
      //   return res
      //     .status(result.status)
      //     .set(result.headers)
      //     .json(result.body);
      // }

      // 2. ロックを取得して重複実行を防ぐ
      const acquired = await this.acquireLock(lockKey);
      if (!acquired) {
        return res.status(409).json({
          error: 'Request is being processed',
        });
      }

      // 3. リクエストを処理
      const originalSend = res.json.bind(res);
      res.json = (body: any) => {
        // レスポンスをキャッシュ
        this.cacheResponse(cacheKey, {
          status: res.statusCode,
          headers: res.getHeaders(),
          body,
        });
        // ロックを解放
        this.releaseLock(lockKey);
        return originalSend(body);
      };

      next();
    } catch (error) {
      // エラー時はロックを解放
      await this.releaseLock(lockKey);
      next(error);
    }
  }

  /**
   * キャッシュキー生成
   */
  private getCacheKey(idempotencyKey: string, req: Request): string {
    // URLとユーザーIDを含めたキーを生成
    const userId = (req as any).user?.id || 'anonymous';
    const urlHash = crypto
      .createHash('md5')
      .update(req.originalUrl)
      .digest('hex');
    return `idempotency:${userId}:${urlHash}:${idempotencyKey}`;
  }

  /**
   * ロック取得
   */
  private async acquireLock(lockKey: string): Promise<boolean> {
    // Temporarily disabled Redis
    // const result = await this.redis.set(
    //   lockKey,
    //   '1',
    //   'NX', // 存在しない場合のみセット
    //   'EX',
    //   this.LOCK_TTL,
    // );
    // return result === 'OK';
    return true;
  }

  /**
   * ロック解放
   */
  private async releaseLock(lockKey: string): Promise<void> {
    // Temporarily disabled Redis
    // await this.redis.del(lockKey);
  }

  /**
   * レスポンスキャッシュ
   */
  private async cacheResponse(key: string, response: any): Promise<void> {
    // Temporarily disabled Redis
    // await this.redis.set(
    //   key,
    //   JSON.stringify(response),
    //   'EX',
    //   this.TTL,
    // );
  }
}

/**
 * 幂等性キー生成ユーティリティ
 */
export class IdempotencyKeyGenerator {
  /**
   * UUID v4ベースのキー生成
   */
  static generate(): string {
    return crypto.randomUUID();
  }

  /**
   * リクエストボディのハッシュベースのキー生成
   */
  static fromRequestBody(body: any): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(body))
      .digest('hex');
    return hash.substring(0, 32);
  }

  /**
   * タイムスタンプ付きキー生成
   */
  static withTimestamp(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${random}`;
  }
}