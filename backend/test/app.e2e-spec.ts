import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same validation pipe as main app
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Subsidy App Backend API is running!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  describe('/applications (e2e)', () => {
    it('GET /applications should return paginated results', () => {
      return request(app.getHttpServer())
        .get('/applications')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('meta');
        });
    });

    it('GET /applications/statistics should return statistics', () => {
      return request(app.getHttpServer())
        .get('/applications/statistics')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('stats');
          expect(res.body.data).toHaveProperty('total');
        });
    });

    it('POST /applications should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/applications')
        .send({})
        .expect(400);
    });
  });

  describe('/plans (e2e)', () => {
    it('GET /plans should return array of plans', () => {
      return request(app.getHttpServer())
        .get('/plans')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('POST /plans should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/plans')
        .send({})
        .expect(400);
    });
  });

  describe('API Documentation', () => {
    it('GET /api should return Swagger documentation', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('Swagger UI');
        });
    });

    it('GET /api-json should return OpenAPI JSON', () => {
      return request(app.getHttpServer())
        .get('/api-json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('openapi');
          expect(res.body).toHaveProperty('info');
          expect(res.body.info.title).toBe('Subsidy App API');
        });
    });
  });
});