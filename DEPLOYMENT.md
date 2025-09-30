# デプロイ手順書

## 📋 デプロイ構成

- **フロントエンド**: Vercel
- **バックエンド**: Railway
- **データベース**: Supabase (PostgreSQL)

## 🚀 1. Railway（バックエンド）のデプロイ

### 1-1. 初回セットアップ

1. [Railway](https://railway.app) にアクセスしてGitHubでログイン
2. 「New Project」→「Deploy from GitHub repo」を選択
3. リポジトリ `sawanori/subsidy_app` を選択
4. Root directory: `backend` に設定

### 1-2. 環境変数の設定

Railway の「Variables」タブで以下を設定：

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

# Frontend URL (Vercelデプロイ後に設定)
FRONTEND_URL=https://subsidy-app.vercel.app

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
https://your-app.up.railway.app/health
```

レスポンス例：
```json
{
  "status": "ok",
  "timestamp": "2025-09-30T08:00:00.000Z"
}
```

---

## 🌐 2. Vercel（フロントエンド）のデプロイ

### 2-1. 初回セットアップ

1. [Vercel](https://vercel.com) にアクセスしてGitHubでログイン
2. 「Add New...」→「Project」を選択
3. リポジトリ `sawanori/subsidy_app` をインポート
4. Root Directory: `frontend` に設定
5. Framework Preset: `Next.js` (自動検出)

### 2-2. ビルド設定

```
Build Command: npm run build
Output Directory: .next
Install Command: npm ci
Node.js Version: 18.x
```

### 2-3. 環境変数の設定

Vercel の「Environment Variables」で設定：

```bash
# Backend API URL (RailwayのURLに置き換え)
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wcxjtqzekllzjpxbbicj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeGp0cXpla2xsempweGJiaWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTUyNTIsImV4cCI6MjA3NDE5MTI1Mn0.y7XGD0yFtEkQ9aKG2vMsz5-F3nEjdeYYYD9OH1-c2js

# Production mode
NODE_ENV=production
```

### 2-4. デプロイ実行

「Deploy」ボタンをクリックしてデプロイ開始。

デプロイURL例：
```
https://subsidy-app.vercel.app
```

---

## 🔄 3. 継続的デプロイ（CD）の設定

### 自動デプロイの有効化

両方のサービスでGitHub連携が有効になっているため：

- **main ブランチにpush** → 本番環境に自動デプロイ
- **develop ブランチにpush** → プレビュー環境に自動デプロイ（Vercel）
- **Pull Request作成** → プレビューURLが自動生成（Vercel）

---

## 🔧 4. デプロイ後の確認事項

### フロントエンド

1. ページが正常に表示されるか
2. バックエンドAPIと通信できるか
3. Supabase認証が動作するか

```bash
# ブラウザで確認
https://subsidy-app.vercel.app
https://subsidy-app.vercel.app/health
```

### バックエンド

1. ヘルスチェックが成功するか
2. Prismaマイグレーションが実行されているか
3. Swagger UIが表示されるか

```bash
# curlで確認
curl https://your-app.up.railway.app/health
curl https://your-app.up.railway.app/api
```

---

## 🐛 トラブルシューティング

### Railway ビルドエラー

```bash
# Prisma Client生成エラーの場合
railway run npx prisma generate
railway run npx prisma migrate deploy
```

### Vercel ビルドエラー

```bash
# ローカルで再現
npm run build

# 環境変数の確認
vercel env pull
```

### CORS エラー

Railwayの環境変数を確認：
```bash
FRONTEND_URL=https://subsidy-app.vercel.app
CORS_ALLOW_ALL=false
```

---

## 📊 コスト試算

### 開発環境
- Railway Developer: $5/月
- Vercel Hobby: 無料
- Supabase Free: 無料
- **合計: $5/月**

### 本番環境
- Railway Team: $20/月
- Vercel Pro: $20/月
- Supabase Pro: $25/月
- **合計: $65/月**

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

1. Railway ログを確認: `railway logs`
2. Vercel ログを確認: Vercel ダッシュボード → Deployments → ログ
3. GitHub Issues で報告
