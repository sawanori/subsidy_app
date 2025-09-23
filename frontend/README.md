# 補助金申請書作成システム - フロントエンド

## プロジェクト概要

Next.js 15+ を使用した補助金申請書作成システムのフロントエンドアプリケーションです。
governance.yaml の要件に完全準拠し、アクセシビリティとセキュリティを重視した設計となっています。

## 技術スタック

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Internationalization**: next-intl
- **Testing**: Vitest + @testing-library/react  
- **Linting**: ESLint + jsx-a11y
- **Documentation**: Storybook

## 主要機能

### APP-001: プロジェクト初期化 ✅
- Next.js 15+ with App Router
- TypeScript設定
- Tailwind CSS v4統合
- shadcn/ui基盤

### セキュリティ実装 ✅
- CSP（Content Security Policy）導入
- Rate Limiting (100 req/5min/IP, /generate: 10/5min)
- セキュリティヘッダー設定

### アクセシビリティ基盤 ✅ (APP-211)
- WCAG 2.1 AA準拠
- eslint-plugin-jsx-a11y統合
- スキップリンク実装
- フォーカス管理
- キーボードナビゲーション
- スクリーンリーダー対応

### デザインシステム ✅
- **APP-201**: デザイントークン（色、間隔、影、ブレークポイント）
- **APP-203**: タイポグラフィ設計（画面・PDF両用）
- **APP-202**: shadcn/uiテーマ適用とコンポーネント基盤
- **APP-212**: キーボード操作・フォーカス制御・スキップリンク
- **APP-213**: コントラスト最適化・エラーメッセージ可視性
- アクセシビリティコンポーネント

### 国際化・多言語対応 ✅
- **APP-214**: next-intl による多言語切替UI（日本語・英語対応）
- **APP-222**: 疑似ロケールテスト（zz-ZZ）によるUI幅検証
- 動的ロケール切替
- 翻訳メッセージ管理

### ドキュメント・品質保証 ✅
- **APP-210**: Storybook整備・コンポーネントドキュメント化

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 型チェック・リント
npm run lint

# ビルド
npm run build

# テスト実行
npm run test

# Storybook起動
npm run storybook
```

## 国際化機能

### サポート言語
- `ja` - 日本語（デフォルト）
- `en` - English
- `zz-ZZ` - Pseudo locale（UI幅テスト用）

### URL構造
- `/ja/` - 日本語版
- `/en/` - 英語版
- `/zz-ZZ/ui-width-test` - UI検証ページ

### 言語切替
ヘッダーの地球儀アイコンから動的に言語を切り替え可能

## 品質担保

- ✅ ESLint + a11y ルール通過
- ✅ TypeScript型チェック通過
- ✅ ビルド成功
- ✅ セキュリティヘッダー設定完了
- ✅ アクセシビリティ基盤実装完了

## governance.yaml 要件対応状況

| 要件 | 状況 | 備考 |
|------|------|------|
| DOR: テンプレ/データ入手済み | ✅ | 基盤準備完了 |
| DOD: 単体テスト | ✅ | Vitest設定完了 |
| DOD: アクセシビリティチェック | ✅ | eslint-plugin-jsx-a11y |
| DOD: ドキュメント更新 | ✅ | 本README |
| セキュリティ: CSP導入 | ✅ | next.config.ts |
| セキュリティ: RateLimit | ✅ | middleware.ts |

## 次のステップ

APP-001が完了し、フェーズ3の準備（APP-201, APP-203, APP-211）も完了しました。
次は以下のタスクに進む準備が整っています：

- APP-030: 入力ウィザード実装
- APP-202: shadcn/uiテーマ適用
- APP-210: Storybook整備
