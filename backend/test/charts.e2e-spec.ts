import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Charts API E2E Tests
 *
 * Phase 6 Day 2: 図表生成API検証
 * - Ganttチャート生成
 * - KPIグラフ生成
 * - 組織図生成
 */

describe('Charts API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/charts/gantt', () => {
    it('should generate Gantt chart with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/gantt')
        .send({
          title: 'プロジェクトスケジュール',
          tasks: [
            {
              name: '要件定義',
              startDate: '2025-01-01',
              endDate: '2025-02-01',
            },
            {
              name: '開発',
              startDate: '2025-02-01',
              endDate: '2025-04-01',
            },
            {
              name: 'テスト',
              startDate: '2025-04-01',
              endDate: '2025-05-01',
            },
          ],
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.body.length).toBeGreaterThan(1000); // PNG画像はある程度のサイズ
    });

    it('should handle empty tasks array', async () => {
      await request(app.getHttpServer())
        .post('/api/charts/gantt')
        .send({
          title: 'Empty Chart',
          tasks: [],
        })
        .expect(500); // 空配列はエラー
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/charts/gantt')
        .send({
          title: 'No Tasks',
          // tasksフィールドなし
        })
        .expect(400);
    });
  });

  describe('POST /api/charts/kpi', () => {
    it('should generate KPI chart with multiple datasets', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/kpi')
        .send({
          title: 'KPI目標推移',
          labels: ['1年目', '2年目', '3年目'],
          datasets: [
            {
              label: '売上高',
              data: [5000000, 8000000, 10000000],
              color: 'rgb(75, 192, 192)',
            },
            {
              label: '顧客数',
              data: [100, 150, 200],
              color: 'rgb(255, 99, 132)',
            },
          ],
          yLabel: '金額（円）',
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.body.length).toBeGreaterThan(1000);
    });

    it('should generate KPI chart with single dataset', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/kpi')
        .send({
          title: 'Single KPI',
          labels: ['現状', '目標'],
          datasets: [
            {
              label: '売上高',
              data: [5000000, 10000000],
            },
          ],
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.body.length).toBeGreaterThan(1000);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/charts/kpi')
        .send({
          title: 'Missing Data',
          // labelsとdatasetsなし
        })
        .expect(400);
    });
  });

  describe('POST /api/charts/org', () => {
    it('should generate organization chart', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/org')
        .send({
          title: 'プロジェクト体制',
          members: [
            {
              name: '山田太郎',
              role: 'プロジェクトマネージャー',
              allocation: 50,
            },
            {
              name: '佐藤花子',
              role: '開発リーダー',
              allocation: 80,
            },
            {
              name: '鈴木一郎',
              role: '開発メンバー',
              allocation: 100,
            },
          ],
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.body.length).toBeGreaterThan(1000);
    });

    it('should handle single member', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/org')
        .send({
          title: 'Single Member',
          members: [
            {
              name: '山田太郎',
              role: 'PM',
              allocation: 100,
            },
          ],
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/charts/org')
        .send({
          title: 'No Members',
          // membersフィールドなし
        })
        .expect(400);
    });
  });

  describe('Chart Generation Performance', () => {
    it('should generate Gantt chart within reasonable time', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/api/charts/gantt')
        .send({
          title: 'Performance Test',
          tasks: Array.from({ length: 10 }, (_, i) => ({
            name: `Task ${i + 1}`,
            startDate: `2025-0${Math.floor(i / 3) + 1}-01`,
            endDate: `2025-0${Math.floor(i / 3) + 1}-${(i % 3 + 1) * 10}`,
          })),
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5秒以内
    });

    it('should generate KPI chart within reasonable time', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/api/charts/kpi')
        .send({
          title: 'Performance Test',
          labels: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
          datasets: Array.from({ length: 5 }, (_, i) => ({
            label: `KPI ${i + 1}`,
            data: Array.from({ length: 12 }, () => Math.random() * 1000000),
          })),
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5秒以内
    });

    it('should generate Org chart within reasonable time', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/api/charts/org')
        .send({
          title: 'Large Team',
          members: Array.from({ length: 20 }, (_, i) => ({
            name: `メンバー${i + 1}`,
            role: `役割${i + 1}`,
            allocation: Math.floor(Math.random() * 100) + 1,
          })),
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5秒以内
    });
  });

  describe('Chart Image Quality', () => {
    it('should generate PNG images with correct format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/gantt')
        .send({
          title: 'Format Test',
          tasks: [
            {
              name: 'Task 1',
              startDate: '2025-01-01',
              endDate: '2025-02-01',
            },
          ],
        })
        .expect(200);

      // PNGファイルのマジックナンバーチェック
      const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      expect(response.body.slice(0, 4)).toEqual(pngSignature);
    });

    it('should generate images with reasonable file size', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/kpi')
        .send({
          title: 'Size Test',
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: 'Revenue',
              data: [1000000, 2000000, 3000000, 4000000],
            },
          ],
        })
        .expect(200);

      const sizeInKB = response.body.length / 1024;
      expect(sizeInKB).toBeGreaterThan(10); // 最低10KB
      expect(sizeInKB).toBeLessThan(500); // 最大500KB
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long task names', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/gantt')
        .send({
          title: 'Long Names',
          tasks: [
            {
              name: 'これは非常に長いタスク名のテストです。'.repeat(5),
              startDate: '2025-01-01',
              endDate: '2025-02-01',
            },
          ],
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should handle zero allocation in org chart', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/org')
        .send({
          title: 'Zero Allocation',
          members: [
            {
              name: 'Test User',
              role: 'Test Role',
              allocation: 0,
            },
          ],
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should handle negative values in KPI data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/charts/kpi')
        .send({
          title: 'Negative Values',
          labels: ['Before', 'After'],
          datasets: [
            {
              label: 'Profit',
              data: [-1000000, 500000],
            },
          ],
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
    });
  });
});