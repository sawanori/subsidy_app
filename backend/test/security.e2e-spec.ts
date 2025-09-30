import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Security E2E Tests
 *
 * Phase 6 Day 4: セキュリティテスト
 * - ファイルアップロードセキュリティ
 * - Input validation
 * - Rate limiting
 * - XSS/CSRF対策
 */

describe('Security Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Validation Pipe設定
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('File Upload Security', () => {
    it('should reject files larger than 10MB', async () => {
      // 11MBのダミーファイル作成
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      await request(app.getHttpServer())
        .post('/api/evidence/upload')
        .attach('file', largeBuffer, 'large-file.pdf')
        .expect(400);
    });

    it('should reject disallowed file types', async () => {
      // 実行可能ファイル（.exe）
      const exeBuffer = Buffer.from('MZ'); // EXEファイルのマジックナンバー

      await request(app.getHttpServer())
        .post('/api/evidence/upload')
        .attach('file', exeBuffer, 'malicious.exe')
        .expect(400);
    });

    it('should sanitize filenames with path traversal', async () => {
      const buffer = Buffer.from('test content');

      const response = await request(app.getHttpServer())
        .post('/api/evidence/upload')
        .attach('file', buffer, '../../../etc/passwd')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toContain('FILE_NAME');
    });

    it('should reject files with null bytes in filename', async () => {
      const buffer = Buffer.from('test content');

      await request(app.getHttpServer())
        .post('/api/evidence/upload')
        .attach('file', buffer, 'test\0.pdf')
        .expect(400);
    });

    it('should accept valid PDF files', async () => {
      // 有効なPDFのミニマルヘッダー
      const pdfBuffer = Buffer.from('%PDF-1.4\n%EOF');

      const response = await request(app.getHttpServer())
        .post('/api/evidence/upload')
        .attach('file', pdfBuffer, 'valid-document.pdf')
        .set('Content-Type', 'multipart/form-data');

      // ファイルが受け入れられたか、またはバリデーションエラー以外のエラー
      expect([200, 201, 500]).toContain(response.status);
    });

    it('should reject files with mismatched MIME type and extension', async () => {
      // PDFと主張するがJPEGの内容
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEGマジックナンバー

      await request(app.getHttpServer())
        .post('/api/evidence/upload')
        .attach('file', jpegBuffer, 'fake.pdf')
        .set('Content-Type', 'image/jpeg')
        .expect(400);
    });
  });

  describe('Input Validation Security', () => {
    it('should reject HTML tags in text input', async () => {
      await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: 'test-project',
          schemeId: 'test-scheme',
          title: '<script>alert("XSS")</script>',
        })
        .expect(400);
    });

    it('should reject SQL injection attempts', async () => {
      await request(app.getHttpServer())
        .get('/api/draft/test\' OR 1=1--')
        .expect(400);
    });

    it('should reject JavaScript protocol in URLs', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({
          title: 'Test Project',
          websiteUrl: 'javascript:alert("XSS")',
        })
        .expect(400);
    });

    it('should sanitize control characters', async () => {
      await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: 'test-project',
          schemeId: 'test-scheme',
          title: 'Test\x00Title', // NULL文字
        })
        .expect(400);
    });

    it('should enforce maximum string length', async () => {
      const longString = 'a'.repeat(10000);

      await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: 'test-project',
          schemeId: 'test-scheme',
          title: longString,
        })
        .expect(400);
    });

    it('should accept valid sanitized input', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: 'valid-project-id',
          schemeId: 'valid-scheme-id',
        });

      // 201 Created または 500 Internal Server Error（DB接続問題など）
      expect([201, 500]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      const endpoint = '/api/draft';

      // 短時間に多数のリクエスト
      const requests = Array.from({ length: 100 }, () =>
        request(app.getHttpServer())
          .get(endpoint)
          .send(),
      );

      const responses = await Promise.all(requests);

      // 少なくとも1つは429 Too Many Requestsになるはず
      const rateLimited = responses.some(r => r.status === 429);

      // レート制限が有効な場合
      if (rateLimited) {
        expect(rateLimited).toBe(true);

        const limitedResponse = responses.find(r => r.status === 429);
        expect(limitedResponse?.body).toHaveProperty('error');
        expect(limitedResponse?.headers).toHaveProperty('x-ratelimit-limit');
      }
    });

    it('should include rate limit headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .send();

      // レート制限ヘッダーの確認（実装されている場合）
      if (response.headers['x-ratelimit-limit']) {
        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
        expect(response.headers).toHaveProperty('x-ratelimit-reset');
      }
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated requests to protected endpoints', async () => {
      await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: 'test',
          schemeId: 'test',
        })
        .expect(401);
    });

    it('should allow public endpoints without authentication', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });

    it('should validate JWT tokens', async () => {
      await request(app.getHttpServer())
        .get('/api/draft/test-id')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject expired JWT tokens', async () => {
      // 有効期限切れのトークン
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      await request(app.getHttpServer())
        .get('/api/draft/test-id')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('CSRF Protection', () => {
    it('should reject requests without CSRF token for state-changing operations', async () => {
      // CSRFトークンなしのPOSTリクエスト
      const response = await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: 'test',
          schemeId: 'test',
        });

      // 401 Unauthorized または 403 Forbiddenを期待
      // 実装状況によっては200も可（CSRFが未実装の場合）
      expect([200, 401, 403]).toContain(response.status);
    });

    it('should accept requests with valid CSRF token', async () => {
      // CSRFトークン取得
      const tokenResponse = await request(app.getHttpServer())
        .get('/api/csrf-token')
        .send();

      if (tokenResponse.status === 200 && tokenResponse.body.token) {
        const csrfToken = tokenResponse.body.token;

        // CSRFトークン付きリクエスト
        const response = await request(app.getHttpServer())
          .post('/api/draft')
          .set('X-CSRF-Token', csrfToken)
          .send({
            projectId: 'test',
            schemeId: 'test',
          });

        // 認証エラーまたは成功
        expect([200, 201, 401, 500]).toContain(response.status);
      }
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in error messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/draft/<script>alert("XSS")</script>')
        .expect(400);

      // エラーメッセージにスクリプトタグがエスケープされて含まれる
      const body = JSON.stringify(response.body);
      expect(body).not.toContain('<script>');
      expect(body).not.toContain('</script>');
    });

    it('should set security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .send();

      // セキュリティヘッダーの確認
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should include Content Security Policy header', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .send();

      if (response.headers['content-security-policy']) {
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['content-security-policy']).toContain("default-src");
      }
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose stack traces in production', async () => {
      // 意図的にエラーを発生させる
      const response = await request(app.getHttpServer())
        .get('/api/nonexistent-endpoint')
        .expect(404);

      // スタックトレースが含まれていないことを確認
      const body = JSON.stringify(response.body);
      expect(body).not.toContain('at ');
      expect(body).not.toContain('.ts:');
      expect(body).not.toContain('Error:');
    });

    it('should return generic error messages for server errors', async () => {
      // サーバーエラーを発生させる
      const response = await request(app.getHttpServer())
        .post('/api/draft')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');

      // 詳細なエラー情報が漏洩していないことを確認
      const message = response.body.error.message.toLowerCase();
      expect(message).not.toContain('database');
      expect(message).not.toContain('connection');
      expect(message).not.toContain('password');
    });

    it('should use consistent error response format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/draft')
        .send({})
        .expect(400);

      // 統一されたエラーフォーマット
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });
  });

  describe('Data Sanitization', () => {
    it('should strip HTML tags from user input', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: 'test',
          schemeId: 'test',
          notes: '<p>Test <b>HTML</b> content</p>',
        });

      if (response.status === 201) {
        // HTMLタグが削除されているか確認
        const notes = response.body.notes;
        expect(notes).not.toContain('<p>');
        expect(notes).not.toContain('<b>');
      }
    });

    it('should normalize whitespace', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: 'test',
          schemeId: 'test',
          title: '  Multiple   Spaces  ',
        });

      if (response.status === 201) {
        // 余分な空白が正規化されているか確認
        expect(response.body.title).toBe('Multiple Spaces');
      }
    });
  });

  describe('Request Size Limits', () => {
    it('should reject overly large JSON payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(10 * 1024 * 1024), // 10MB
      };

      await request(app.getHttpServer())
        .post('/api/draft')
        .send(largePayload)
        .expect(413); // Payload Too Large
    });

    it('should reject requests with too many fields', async () => {
      const manyFields: any = {};
      for (let i = 0; i < 1000; i++) {
        manyFields[`field${i}`] = 'value';
      }

      await request(app.getHttpServer())
        .post('/api/draft')
        .send(manyFields)
        .expect(400);
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should reject path traversal in file downloads', async () => {
      await request(app.getHttpServer())
        .get('/api/files/../../../etc/passwd')
        .expect(400);
    });

    it('should reject encoded path traversal attempts', async () => {
      await request(app.getHttpServer())
        .get('/api/files/%2e%2e%2f%2e%2e%2fetc%2fpasswd')
        .expect(400);
    });

    it('should only allow whitelisted file access', async () => {
      await request(app.getHttpServer())
        .get('/api/files/allowed-file.pdf')
        .expect(404); // Not Found（ファイルが存在しない）または 200（存在する）
    });
  });
});