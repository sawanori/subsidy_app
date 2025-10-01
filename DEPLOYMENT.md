# デプロイ手順書

## 📋 デプロイ構成

- **フロントエンド**: Render (Web Service)
- **バックエンド**: Render (Web Service)
- **データベース**: Supabase (PostgreSQL)

## 🚀 1. Render（バックエンド）のデプロイ

### 1-1. 初回セットアップ

1. [Render](https://render.com) にアクセスしてGitHubでログイン
2. 「New +」→「Web Service」を選択
3. リポジトリ `sawanori/subsidy_app` を接続
4. 以下の設定を入力：
   - **Name**: `subsidy-app-backend`
   - **Region**: Singapore (最も近いリージョン)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`

### 1-2. 環境変数の設定

Render の「Environment」タブで以下を設定：

```bash
# Database
DATABASE_URL=postgresql://postgres.wcxjtqzekllzjpxbbicj:noritaka8master4mind@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.wcxjtqzekllzjpxbbicj:noritaka8master4mind@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://wcxjtqzekllzjpxbbicj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeGp0cXpla2xsempweGJiaWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTUyNTIsImV4cCI6MjA3NDE5MTI1Mn0.y7XGD0yFtEkQ9aKG2vMsz5-F3nEjdeYYYD9OH1-c2js
SUPABASE_SERVICE_KEY=noritaka8master4mind

# API Keys (本番用の実際のキーに置き換える)
OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini
ESTAT_APP_ID=your_estat_app_id
RESAS_API_KEY=your_resas_api_key

# Frontend URL (Renderデプロイ後に設定)
FRONTEND_URL=https://subsidy-app.onrender.com

# Production settings
NODE_ENV=production
PORT=3001
USE_MOCK_LLM=false
SKIP_DB_CONNECTION=false
CORS_ALLOW_ALL=false
```

### 1-3. デプロイ確認

デプロイが完了したら、以下のURLで確認：
```
https://subsidy-app-backend.onrender.com/health
```

レスポンス例：
```json
{
  "status": "ok",
  "timestamp": "2025-09-30T08:00:00.000Z"
}
```

---

## 🌐 2. Render（フロントエンド）のデプロイ

### 2-1. 初回セットアップ

1. [Render](https://render.com) にアクセス（既にログイン済み）
2. 「New +」→「Web Service」を選択
3. 同じリポジトリ `sawanori/subsidy_app` を選択
4. 以下の設定を入力：
   - **Name**: `subsidy-app`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

### 2-2. 環境変数の設定

Render の「Environment」タブで設定：

```bash
# Backend API URL (バックエンドのRender URLに置き換え)
NEXT_PUBLIC_API_URL=https://subsidy-app-backend.onrender.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wcxjtqzekllzjpxbbicj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeGp0cXpla2xsempweGJiaWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTUyNTIsImV4cCI6MjA3NDE5MTI1Mn0.y7XGD0yFtEkQ9aKG2vMsz5-F3nEjdeYYYD9OH1-c2js

# Production mode
NODE_ENV=production
```

### 2-3. next.config.ts の修正が必要

フロントエンドを本番環境にデプロイする前に、`next.config.ts` の `rewrites()` を環境変数ベースに変更する必要があります。

### 2-4. デプロイ実行

「Create Web Service」ボタンをクリックしてデプロイ開始。

デプロイURL例：
```
https://subsidy-app.onrender.com
```

---

## 🔄 3. 継続的デプロイ（CD）の設定

### 自動デプロイの有効化

Renderでは、以下の自動デプロイが設定されます：

- **main ブランチにpush** → 本番環境に自動デプロイ（フロントエンド・バックエンド両方）
- **Pull Request作成** → プレビュー環境を作成可能（有料プラン）
- デプロイは5-10分程度かかります（初回は15分程度）

---

## 🔧 4. デプロイ後の確認事項

### フロントエンド

1. ページが正常に表示されるか
2. バックエンドAPIと通信できるか
3. Supabase認証が動作するか

```bash
# ブラウザで確認
https://subsidy-app.onrender.com
https://subsidy-app.onrender.com/health
```

### バックエンド

1. ヘルスチェックが成功するか
2. Prismaマイグレーションが実行されているか
3. Swagger UIが表示されるか

```bash
# curlで確認
curl https://subsidy-app-backend.onrender.com/health
curl https://subsidy-app-backend.onrender.com/api
```

---

## 🐛 トラブルシューティング

### Render ビルドエラー（バックエンド）

```bash
# Prisma Client生成エラーの場合
# Build Commandに以下が含まれているか確認：
npm ci && npx prisma generate && npm run build

# デプロイログを確認して、Prismaが正常に生成されているか確認
```

### Render ビルドエラー（フロントエンド）

```bash
# ローカルで再現
cd frontend
npm ci
npm run build

# next.config.ts の rewrites が環境変数ベースになっているか確認
```

### CORS エラー

バックエンドの環境変数を確認：
```bash
FRONTEND_URL=https://subsidy-app.onrender.com
CORS_ALLOW_ALL=false
```

### Render Free Tier の制限

- **スリープ**: 15分間リクエストがないとスリープ状態になります
- **起動時間**: スリープから復帰に30秒〜1分程度かかります
- **対策**: 有料プラン（$7/月〜）にアップグレードするとスリープなし

---

## 📊 コスト試算

### 開発環境（無料）
- Render Free（フロントエンド）: 無料
- Render Free（バックエンド）: 無料
- Supabase Free: 無料
- **合計: $0/月**
  - **制限**: 各サービス750時間/月、スリープあり

### 本番環境（有料）
- Render Starter（フロントエンド）: $7/月
- Render Starter（バックエンド）: $7/月
- Supabase Pro: $25/月
- **合計: $39/月**
  - **メリット**: スリープなし、カスタムドメイン対応

---

## 🔐 セキュリティチェックリスト

- [ ] 環境変数に機密情報を直接コミットしていないか
- [ ] CORS設定が適切か
- [ ] HTTPS通信が有効か
- [ ] CSP（Content Security Policy）が設定されているか
- [ ] Rate limitingが有効か

---

## 📝 デプロイログ

| 日付 | 環境 | バージョン | デプロイ担当 | 備考 |
|------|------|-----------|------------|------|
| 2025-09-30 | production | v1.0.0 | - | 初回デプロイ |

---

## 🆘 サポート

デプロイで問題が発生した場合：

1. Render ログを確認: Dashboard → Service → Logs タブ
2. GitHub Actions の CI/CD ログを確認
3. GitHub Issues で報告

---

## 📝 next.config.ts の修正（重要）

フロントエンドデプロイ前に、`frontend/next.config.ts` を修正してください：

```typescript
// rewrites() を環境変数ベースに変更
async rewrites() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return [
    {
      source: '/api/:path*',
      destination: `${apiUrl}/:path*`,
    },
    // 他のrewritesも同様に修正
  ];
}
```

または、フロントエンド側で直接 `NEXT_PUBLIC_API_URL` を使用してAPIコールする方法も検討してください。
