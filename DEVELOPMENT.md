# 開発環境セットアップガイド

## 🚀 クイックスタート（APIキーなし）

開発環境ではAPIキーなしで動作するモック機能が有効になっています。

### 1. 環境変数の確認

`backend/.env` ファイルで以下の設定を確認してください：

```bash
# モックモードを有効化（APIキー不要）
USE_MOCK_LLM=true
ESTAT_APP_ID=mock
RESAS_API_KEY=mock
```

これらの設定により、以下の機能がモックモードで動作します：

- ✅ **OpenAI API** → テンプレートベースのモック応答
- ✅ **e-Stat API** → サンプル統計データ
- ✅ **RESAS API** → サンプル地域経済データ
- ✅ **Database** → 接続スキップ（`SKIP_DB_CONNECTION=true` でデータベース不要）

### 2. バックエンド起動

```bash
cd backend
npm install
npm run start:dev
```

起動時に以下のようなメッセージが表示されます：

```
🔧 Using MOCK OpenAI Provider - API calls will be simulated
⚠️  RESAS API is running in MOCK mode
⚠️  e-Stat API is running in MOCK mode
```

### 3. フロントエンド起動

```bash
cd frontend
npm install
npm run dev
```

### 4. 動作確認

ブラウザで http://localhost:3000 にアクセスして、アプリケーションが正常に動作することを確認してください。

## 🔑 本番APIキーの設定

実際のAPIを使用する場合は、以下のように設定します：

### OpenAI API

```bash
# backend/.env
USE_MOCK_LLM=false
OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini
```

### e-Stat API

1. https://www.e-stat.go.jp/api/ でアプリケーションIDを取得
2. `.env` に設定：

```bash
ESTAT_APP_ID=your_estat_application_id
```

### RESAS API

1. https://opendata.resas-portal.go.jp/ でAPIキーを取得
2. `.env` に設定：

```bash
RESAS_API_KEY=your_resas_api_key
```

## 📝 モック機能の詳細

### OpenAI モックプロバイダー

`backend/src/modules/draft/llm/mock-openai.provider.ts`

**機能**:
- プロンプト内容に応じたテンプレートベースの応答生成
- 実際のAPI呼び出しのレイテンシをシミュレート（500-1500ms）
- トークン数とコスト計算（モックのためコストは0円）

**対応するコンテキスト**:
- 市場分析
- 事業計画
- KPI・目標設定
- 課題・リスク分析
- スケジュール
- 組織体制

### RESAS API モック

`backend/src/modules/research/connectors/resas.connector.ts`

**機能**:
- 都道府県一覧
- 市区町村一覧
- 人口構成データ
- 産業構造データ

### e-Stat API モック

`backend/src/modules/research/connectors/estat.connector.ts`

**機能**:
- 統計表情報
- 統計データ取得
- メタ情報

## 🧪 テスト実行

### バックエンドテスト

```bash
cd backend

# ユニットテスト
npm run test

# E2Eテスト
npm run test:e2e

# カバレッジ
npm run test:cov
```

### フロントエンドテスト

```bash
cd frontend

# ユニットテスト
npm run test

# E2Eテスト
npm run test:e2e

# Playwright UIモード
npm run test:e2e:ui
```

## 🔧 トラブルシューティング

### モックモードが動作しない

1. `.env` ファイルの設定を確認
2. サーバーを再起動
3. `node_modules` を削除して再インストール

```bash
rm -rf node_modules
npm install
```

### データベース接続エラー

Supabaseデータベースに接続できない場合：

```bash
# Prismaクライアント再生成
cd backend
npx prisma generate

# マイグレーション実行
npx prisma migrate deploy
```

### ポート衝突エラー

デフォルトポートが使用中の場合：

```bash
# バックエンド (デフォルト: 3001)
PORT=3002 npm run start:dev

# フロントエンド (デフォルト: 3000)
PORT=3001 npm run dev
```

## 📚 参考資料

- [CLAUDE.md](./CLAUDE.md) - プロジェクト全体の構成
- [OPERATIONS.md](./OPERATIONS.md) - 運用ガイド
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - データベースセットアップ
- [DATABASE_TABLES_LIST.md](./DATABASE_TABLES_LIST.md) - スキーマ情報

## 💡 開発のヒント

### 1. モック応答のカスタマイズ

`backend/src/modules/draft/llm/mock-openai.provider.ts` の `generateMockResponse` メソッドを編集して、応答内容をカスタマイズできます。

### 2. ログレベルの調整

```bash
# backend/.env
LOG_LEVEL=debug  # verbose | debug | log | warn | error
```

### 3. ホットリロード

両方のサーバーはファイル変更を自動検出して再起動します：

- **バックエンド**: `nodemon` + `ts-node`
- **フロントエンド**: Next.js Fast Refresh

### 4. API動作確認

```bash
# ヘルスチェック
curl http://localhost:3001/health

# モックLLM動作確認
curl -X POST http://localhost:3001/api/draft \
  -H "Content-Type: application/json" \
  -d '{"prompt": "市場分析を生成してください"}'
```

## 🎯 次のステップ

1. ✅ 開発環境で動作確認
2. 📝 機能実装・テスト作成
3. 🔑 本番APIキー取得・設定
4. 🚀 デプロイ準備

---

**質問・問題がある場合**: GitHub Issuesで報告してください