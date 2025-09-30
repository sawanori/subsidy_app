# 申請ドキュメント自動生成アプリ / Subsidy Application Document Auto-Generation App

> 日本の補助金申請書類を自動生成する多機能Webアプリケーション

**📖 Read this in other languages:** [日本語](#) | [English](README-en.md)

## 🎯 プロジェクト概要

補助金申請に必要な複雑な書類作成を効率化するためのフルスタックWebアプリケーションです。AIを活用した自動生成、OCR処理、PDF出力機能を備え、申請業務を大幅に効率化します。

### 主要機能

- 📝 **申請書ウィザード**: ステップバイステップで申請情報を入力
- 🤖 **AI自動生成**: OpenAI APIを活用した計画書・KPI自動生成
- 📄 **PDF/DOCX出力**: 様式に合わせた高品質ドキュメント生成
- 🔍 **OCR処理**: 日本語対応のテキスト抽出（Tesseract.js）
- 📊 **データ可視化**: ガントチャート、組織図、KPIグラフ自動生成
- 🔐 **セキュリティ**: AES256暗号化、ファイルスキャン、監査ログ
- 🌏 **多言語対応**: 日本語・英語・中国語・韓国語サポート（計画中）

## 🏗️ アーキテクチャ

### 技術スタック

**Frontend**
- Next.js 15.5.2（App Router）
- React 19.1.0 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- React Hook Form + Zod
- Playwright（E2E） + Jest/Vitest（単体テスト）

**Backend**
- NestJS 11.1.6 + TypeScript
- Prisma ORM 6.15.0
- PostgreSQL（Supabase）
- Puppeteer（PDF生成）
- Tesseract.js（OCR）
- OpenAI API

**Infrastructure**
- Vercel（Frontend）
- Railway/Render（Backend）
- Supabase（Database + Auth）
- S3互換ストレージ

### プロジェクト構成

```
subsidyApp/
├── frontend/          # Next.js フロントエンド
│   ├── src/
│   │   ├── app/      # App Router ページ
│   │   ├── components/ # UIコンポーネント
│   │   └── lib/      # ユーティリティ
│   └── e2e/          # Playwright E2Eテスト
├── backend/          # NestJS バックエンド
│   ├── src/
│   │   ├── applications/ # 申請管理
│   │   ├── evidence/  # 証跡処理（OCR）
│   │   ├── modules/   # 各種モジュール
│   │   └── prisma/    # Prisma設定
│   └── prisma/       # DB スキーマ
├── plan.yaml         # プロジェクト計画
└── governance.yaml   # 品質基準
```

## 🚀 クイックスタート

### 前提条件

- Node.js 18+ / npm 9+
- PostgreSQL（またはSupabase）
- OpenAI APIキー（任意）

### 1. インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/subsidyapp.git
cd subsidyApp

# 全依存関係をインストール（npm workspaces使用）
npm run install:all
```

### 2. 環境変数の設定

```bash
# Backendの環境変数
cp backend/.env.local.example backend/.env.local
# エディタで backend/.env.local を編集

# Frontendの環境変数
cp frontend/.env.local.example frontend/.env.local
# エディタで frontend/.env.local を編集
```

必要な環境変数:
- `DATABASE_URL`: PostgreSQL接続URL
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: Supabase設定
- `OPENAI_API_KEY`: OpenAI APIキー（任意）

### 3. データベースのセットアップ

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 4. 開発サーバーの起動

```bash
# ルートから両方を同時起動
npm run dev

# または個別に起動
npm run dev:backend  # http://localhost:3001
npm run dev:frontend # http://localhost:3000
```

## 📚 コマンド一覧

### ルートレベル

```bash
npm run dev           # Frontend + Backend同時起動
npm run build         # 両方をビルド
npm run test          # 全テスト実行
npm run lint          # 全Lint実行
npm run clean         # ビルド成果物削除
```

### Backend

```bash
cd backend
npm run start:dev     # 開発サーバー（ts-node）
npm run build         # TypeScript コンパイル
npm run start:prod    # 本番サーバー
npm test              # Jestテスト
npm run test:cov      # カバレッジレポート
npm run lint          # ESLint
npx prisma studio     # データベースブラウザ
```

### Frontend

```bash
cd frontend
npm run dev           # 開発サーバー
npm run build         # 本番ビルド
npm run test:unit     # Jest単体テスト
npm run test:e2e      # Playwright E2E
npm run test:accessibility # アクセシビリティテスト
npm run lint          # ESLint
npm run storybook     # Storybook起動
```

## 🧪 テスト

プロジェクトはgovernance.yamlで定義された品質基準に従います。

```bash
# Backend: 単体 + 統合テスト
cd backend && npm test

# Frontend: 単体テスト
cd frontend && npm run test:unit

# Frontend: E2Eテスト
cd frontend && npm run test:e2e

# カバレッジレポート
npm run test:coverage
```

**品質ゲート**:
- テストカバレッジ: 70%以上（目標）
- アクセシビリティ: WCAG 2.1 AA準拠
- パフォーマンス: プレビュー生成 ≤2秒

## 📖 ドキュメント

- [プロジェクト計画書](plan.yaml) - 全チケット・スプリント情報
- [品質基準](governance.yaml) - DoR/DoD・セキュリティ基準
- [Backend README](backend/README.md) - API詳細
- [Frontend README](frontend/README.md) - UI/UX詳細
- [CLAUDE.md](CLAUDE.md) - AI開発アシスタント向けガイド

## 🔒 セキュリティ

- **認証**: Supabase Auth（Email OTP / OAuth）
- **暗号化**: AES256（保存時）、TLS1.2+（通信時）
- **ファイルスキャン**: ClamAV統合
- **監査ログ**: 全操作記録
- **Rate Limiting**: 100 req/5min/IP

詳細は[SECURITY_WARNING.md](SECURITY_WARNING.md)を参照してください。

## 🤝 コントリビューション

1. このリポジトリをFork
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにPush (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

**開発ガイドライン**:
- Definition of Ready (DoR)を満たすこと
- テストカバレッジ70%以上を維持
- ESLintルールに従う
- コミットメッセージは[Conventional Commits](https://www.conventionalcommits.org/)形式

## 📜 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)を参照

## 👥 作成者

- **プロジェクトリード**: [Your Name]
- **Frontend**: worker1
- **Backend**: worker2
- **Database**: worker3

## 📞 サポート

- 🐛 バグ報告: [GitHub Issues](https://github.com/yourusername/subsidyapp/issues)
- 💬 質問・相談: [GitHub Discussions](https://github.com/yourusername/subsidyapp/discussions)
- 📧 Email: support@example.com

## 🗺️ ロードマップ

### 完了 ✅
- [x] 基本インフラ構築
- [x] 申請ウィザードUI
- [x] PDF生成機能

### 進行中 🚧
- [ ] テストカバレッジ改善（3% → 70%）
- [ ] CI/CDパイプライン
- [ ] 多言語化（i18n）

### 計画中 📋
- [ ] AI自動入力補助
- [ ] モバイルアプリ対応
- [ ] ブロックチェーン証明

詳細は[plan.yaml](plan.yaml)のチケット管理を参照。

---

**Status**: 🚧 Active Development (Prototype Stage)
**Version**: 0.2.0
**Last Updated**: 2025年9月30日