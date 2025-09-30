import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' && req.url.includes('/intake/upload')) {
      console.log('Upload request headers:', req.headers);
    }
    next();
  });

  // CORS configuration FIRST
  // PDFビューアの取得やローカル開発環境の多様なオリジンにも対応するため、
  // オリジンを動的許可（本番で厳格化する場合は CORS_ALLOW_ALL=false を設定）
  const allowAllCors = process.env.CORS_ALLOW_ALL !== 'false';
  app.enableCors({
    origin: allowAllCors
      ? true
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3002',
          'http://127.0.0.1:3003',
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          process.env.FRONTEND_URL,
        ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"]
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    // PDF等のクロスオリジン取得/埋め込みを許可
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }));

  const config = new DocumentBuilder()
    .setTitle('Subsidy App API')
    .setDescription('API for subsidy application document generation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Static serve for uploaded files (for viewers expecting /uploads/...)
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'uploads'), {
      setHeaders: (res, filePath) => {
        // Display inline by default
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'private, max-age=300');
      },
    })
  );

  // Optionally set a global API prefix (e.g. API_PREFIX=api -> /api/intake/upload)
  const apiPrefix = process.env.API_PREFIX?.trim();
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host as any);
  console.log(`Application is running on: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  if (apiPrefix) {
    console.log(`Global API prefix enabled: /${apiPrefix}`);
  }
}
bootstrap();
