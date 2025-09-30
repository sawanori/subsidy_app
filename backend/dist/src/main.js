"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const express = __importStar(require("express"));
const path = __importStar(require("path"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        if (req.method === 'POST' && req.url.includes('/intake/upload')) {
            console.log('Upload request headers:', req.headers);
        }
        next();
    });
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
    app.use((0, helmet_1.default)({
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
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Subsidy App API')
        .setDescription('API for subsidy application document generation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
        setHeaders: (res, filePath) => {
            res.setHeader('Content-Disposition', 'inline');
            res.setHeader('Cache-Control', 'private, max-age=300');
        },
    }));
    const apiPrefix = process.env.API_PREFIX?.trim();
    if (apiPrefix) {
        app.setGlobalPrefix(apiPrefix);
    }
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';
    await app.listen(port, host);
    console.log(`Application is running on: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
    if (apiPrefix) {
        console.log(`Global API prefix enabled: /${apiPrefix}`);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map