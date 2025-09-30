import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Draft to PDF E2E Tests
 *
 * Phase 6 Day 2: 統合フロー検証
 * - Draft生成 → 検証 → PDF生成
 * - 図表埋め込み確認
 * - エラーケース
 */

describe('Draft to PDF Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testProjectId: string;
  let testSchemeId: string;
  let testDraftId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // テストデータ準備
    await setupTestData();
  });

  afterAll(async () => {
    // テストデータクリーンアップ
    await cleanupTestData();
    await app.close();
  });

  /**
   * テストデータ準備
   */
  async function setupTestData() {
    // 1. テストScheme作成
    const scheme = await prisma.scheme.upsert({
      where: { id: 'test-scheme-e2e' },
      update: {},
      create: {
        id: 'test-scheme-e2e',
        name: 'E2Eテスト補助金',
        description: 'E2Eテスト用の補助金制度',
        organization: 'テスト機関',
        category: 'テスト',
        deadlineDate: new Date('2025-12-31'),
      },
    });
    testSchemeId = scheme.id;

    // 2. テストSchemeTemplate作成
    await prisma.schemeTemplate.upsert({
      where: { schemeId: testSchemeId },
      update: {},
      create: {
        schemeId: testSchemeId,
        requirements: {
          sections: [
            { id: 'background', name: '背景・課題', required: true, minChars: 100 },
            { id: 'budget', name: '予算', required: true, minItems: 1 },
            { id: 'kpi', name: 'KPI', required: false },
            { id: 'roadmap', name: 'スケジュール', required: false },
            { id: 'team', name: '体制', required: false },
          ],
          budget: { maxTotal: 10000000 },
        },
        template: {},
      },
    });

    // 3. テストProject作成
    const project = await prisma.project.create({
      data: {
        schemeId: testSchemeId,
        title: 'E2Eテストプロジェクト',
        goal: 'テスト実行',
        constraints: {},
        market: {},
        assets: {},
      },
    });
    testProjectId = project.id;
  }

  /**
   * テストデータクリーンアップ
   */
  async function cleanupTestData() {
    try {
      if (testDraftId) {
        await prisma.draft.delete({ where: { id: testDraftId } }).catch(() => {});
      }
      if (testProjectId) {
        await prisma.project.delete({ where: { id: testProjectId } }).catch(() => {});
      }
      await prisma.schemeTemplate.delete({ where: { schemeId: testSchemeId } }).catch(() => {});
      await prisma.scheme.delete({ where: { id: testSchemeId } }).catch(() => {});
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  describe('Complete Flow: Draft → Validation → PDF', () => {
    it('should create draft, validate, and generate PDF with charts', async () => {
      // Step 1: Draft作成
      const createRes = await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: testProjectId,
          schemeId: testSchemeId,
        })
        .expect(201);

      expect(createRes.body).toHaveProperty('id');
      expect(createRes.body).toHaveProperty('version', 1);
      expect(createRes.body).toHaveProperty('sections');
      testDraftId = createRes.body.id;

      // Step 2: Draft取得確認
      const getRes = await request(app.getHttpServer())
        .get(`/api/draft/${testDraftId}`)
        .expect(200);

      expect(getRes.body.id).toBe(testDraftId);

      // Step 3: 検証実行
      const validateRes = await request(app.getHttpServer())
        .post('/api/validate/draft')
        .send({
          draftId: testDraftId,
          schemeId: testSchemeId,
        })
        .expect(200);

      expect(validateRes.body).toHaveProperty('isValid');
      expect(validateRes.body).toHaveProperty('errors');
      expect(validateRes.body).toHaveProperty('warnings');
      expect(validateRes.body).toHaveProperty('stats');
      expect(Array.isArray(validateRes.body.errors)).toBe(true);
      expect(Array.isArray(validateRes.body.warnings)).toBe(true);

      // Step 4: PDF生成（ダウンロード）
      const pdfRes = await request(app.getHttpServer())
        .get(`/api/pdf-generator/draft/${testDraftId}`)
        .expect(200);

      expect(pdfRes.headers['content-type']).toBe('application/pdf');
      expect(pdfRes.body.length).toBeGreaterThan(0);
      expect(pdfRes.headers['content-disposition']).toContain('attachment');

      // Step 5: PDFプレビュー
      const previewRes = await request(app.getHttpServer())
        .get(`/api/pdf-generator/draft/${testDraftId}/preview`)
        .expect(200);

      expect(previewRes.headers['content-type']).toBe('application/pdf');
      expect(previewRes.headers['content-disposition']).toBe('inline');

      // Step 6: サマリーPDF生成
      const summaryRes = await request(app.getHttpServer())
        .get(`/api/pdf-generator/draft/${testDraftId}/summary`)
        .expect(200);

      expect(summaryRes.headers['content-type']).toBe('application/pdf');
      expect(summaryRes.body.length).toBeGreaterThan(0);
    }, 60000); // 60秒タイムアウト（PDF生成は時間がかかる）
  });

  describe('Draft with Charts Data', () => {
    it('should generate PDF with embedded charts when sections have data', async () => {
      // 図表データを含むDraft作成
      const draftWithCharts = await prisma.draft.create({
        data: {
          projectId: testProjectId,
          version: 2,
          sections: {
            background: 'これは図表付きテストです。'.repeat(20), // 100文字以上
            budget: [
              { category: '人件費', item: '開発', quantity: 1, unitPrice: 1000000, amount: 1000000 },
            ],
            kpi: [
              { metric: '売上高', baseline: 5000000, target: 10000000, unit: '円' },
              { metric: '顧客数', baseline: 100, target: 200, unit: '人' },
            ],
            roadmap: [
              { phase: 'Phase1', task: '要件定義', startDate: '2025-01-01', endDate: '2025-02-01', deliverable: '要件書' },
              { phase: 'Phase2', task: '開発', startDate: '2025-02-01', endDate: '2025-04-01', deliverable: 'システム' },
            ],
            team: [
              { name: '山田太郎', role: 'PM', expertise: '10年', allocation: 50 },
              { name: '佐藤花子', role: '開発', expertise: '5年', allocation: 100 },
            ],
          },
          references: [],
          metadata: {},
        },
      });

      const chartDraftId = draftWithCharts.id;

      // PDF生成（図表埋め込みあり）
      const pdfRes = await request(app.getHttpServer())
        .get(`/api/pdf-generator/draft/${chartDraftId}`)
        .expect(200);

      expect(pdfRes.headers['content-type']).toBe('application/pdf');
      expect(pdfRes.body.length).toBeGreaterThan(100000); // 図表付きPDFはサイズが大きい

      // クリーンアップ
      await prisma.draft.delete({ where: { id: chartDraftId } });
    }, 60000);
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent draft', async () => {
      await request(app.getHttpServer())
        .get('/api/draft/non-existent-id')
        .expect(404);
    });

    it('should return 500 for PDF generation with invalid draft', async () => {
      await request(app.getHttpServer())
        .get('/api/pdf-generator/draft/invalid-draft-id')
        .expect(500);
    });

    it('should handle validation with non-existent draft', async () => {
      await request(app.getHttpServer())
        .post('/api/validate/draft')
        .send({
          draftId: 'non-existent',
          schemeId: testSchemeId,
        })
        .expect(500);
    });

    it('should handle draft creation with invalid project', async () => {
      await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: 'invalid-project-id',
          schemeId: testSchemeId,
        })
        .expect(500);
    });
  });

  describe('Draft Versioning', () => {
    it('should create multiple versions of draft', async () => {
      // Version 1
      const v1Res = await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: testProjectId,
          schemeId: testSchemeId,
        })
        .expect(201);

      expect(v1Res.body.version).toBe(1);

      // Version 2
      const v2Res = await request(app.getHttpServer())
        .post('/api/draft')
        .send({
          projectId: testProjectId,
          schemeId: testSchemeId,
        })
        .expect(201);

      expect(v2Res.body.version).toBe(2);

      // プロジェクト内のDraft一覧取得
      const listRes = await request(app.getHttpServer())
        .get(`/api/draft/project/${testProjectId}`)
        .expect(200);

      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBeGreaterThanOrEqual(2);

      // クリーンアップ
      await prisma.draft.deleteMany({ where: { projectId: testProjectId } });
    });
  });

  describe('PDF Generation Performance', () => {
    it('should generate PDF within reasonable time', async () => {
      const draft = await prisma.draft.create({
        data: {
          projectId: testProjectId,
          version: 99,
          sections: {
            background: 'パフォーマンステスト'.repeat(100),
          },
          references: [],
          metadata: {},
        },
      });

      const startTime = Date.now();

      await request(app.getHttpServer())
        .get(`/api/pdf-generator/draft/${draft.id}`)
        .expect(200);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000); // 30秒以内

      // クリーンアップ
      await prisma.draft.delete({ where: { id: draft.id } });
    }, 35000);
  });
});