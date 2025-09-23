# Subsidy App Backend

申請ドキュメント自動生成アプリのバックエンドAPI

## 概要

NestJSを使用したRESTful API。以下の機能を提供：
- 申請書類の生成とバリデーション
- OpenAPI仕様書自動生成
- セキュリティ対策 (Rate limiting, CSP, RBAC)
- 単体・統合テスト

## 技術スタック

- **フレームワーク**: NestJS 11
- **言語**: TypeScript
- **テスト**: Jest + Supertest
- **API仕様**: OpenAPI/Swagger
- **セキュリティ**: Helmet, Throttler
- **バリデーション**: class-validator

## セットアップ

### 前提条件
- Node.js 18+
- npm 9+

### インストール
```bash
npm install
```

### 環境変数
`.env.example`を`.env`にコピーして設定：
```bash
cp .env.example .env
```

### 起動
```bash
# 開発環境
npm run start:dev

# 本番環境
npm run build
npm run start:prod
```

## API仕様書

サーバー起動後、以下のURLでSwagger UIにアクセス可能：
http://localhost:3001/api

## テスト

```bash
# 単体テスト
npm test

# E2Eテスト
npm run test:e2e

# カバレッジ
npm run test:cov
```

## セキュリティ機能

### Rate Limiting
- デフォルト: 100リクエスト/5分/IP
- 生成API: 10リクエスト/5分/IP

### セキュリティヘッダー
- CSP: `default-src 'self'; img-src 'self' data: blob:`
- HSTS: 1年間
- その他のHelmetデフォルト設定

### RBAC準備
- Role enum: ADMIN, EDITOR, VIEWER
- Guards実装済み

## プロジェクト構造

```
src/
├── common/           # 共通機能
│   ├── decorators/   # デコレータ
│   ├── enums/        # 列挙型
│   └── guards/       # ガード
├── app.controller.ts # メインコントローラー
├── app.module.ts     # ルートモジュール
├── app.service.ts    # メインサービス
└── main.ts           # エントリーポイント
```

## ガバナンス準拠

governance.yamlの要件に準拠：
- ✅ TLS1.2+ (production時)
- ✅ Rate limiting実装
- ✅ CSP実装
- ✅ RBAC準備完了
- ✅ 単体・統合テスト
- ✅ セキュリティスキャン (npm audit)

## 次のステップ

- APP-020: Applications CRUD API実装
- APP-021: Plans CRUD実装
- データベース連携 (worker3完了後)