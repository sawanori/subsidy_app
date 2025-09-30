import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class AuditService {
  private readonly auditLogPath = path.join(process.cwd(), 'logs', 'audit');

  record(payload: any) {
    // 既存の互換性を保つ
    this.log({
      applicationId: payload?.applicationId,
      action: 'auto-plan',
      response: payload,
      citations: payload?.plan?.citations || payload?.citations || [],
    });
  }

  async log(data: {
    applicationId: string;
    action: string;
    prompt?: string;
    response?: any;
    citations?: any[];
    model?: string;
    error?: any;
  }) {
    try {
      // 監査ログディレクトリを作成
      await fs.mkdir(this.auditLogPath, { recursive: true });

      // タイムスタンプとハッシュを生成
      const timestamp = new Date().toISOString();
      const promptHash = data.prompt
        ? createHash('sha256').update(data.prompt).digest('hex')
        : null;

      // 監査ログエントリを作成
      const auditEntry = {
        timestamp,
        applicationId: data.applicationId,
        action: data.action,
        promptHash,
        model: data.model || process.env.OPENAI_MODEL || 'mock',
        citations: data.citations || [],
        success: !data.error,
        errorMessage: data.error?.message,
        metadata: {
          responseSize: JSON.stringify(data.response || {}).length,
          citationCount: (data.citations || []).length,
        }
      };

      // ファイル名を生成（日付別）
      const dateStr = timestamp.split('T')[0];
      const filename = `audit-${dateStr}.jsonl`;
      const filepath = path.join(this.auditLogPath, filename);

      // JSONLファイルに追記（append-only）
      await fs.appendFile(
        filepath,
        JSON.stringify(auditEntry) + '\n',
        'utf-8'
      );

      // コンソールにも出力（開発環境）
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTO-PLAN AUDIT]', {
          action: data.action,
          applicationId: data.applicationId,
          timestamp,
          citations: data.citations?.length || 0,
        });
      }

      return auditEntry;
    } catch (error) {
      // 監査ログ失敗はサイレントに処理（メイン処理を妨げない）
      console.error('Audit logging failed:', error);
      return null;
    }
  }
}

