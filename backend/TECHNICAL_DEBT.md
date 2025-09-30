# 技術的負債ドキュメント (Technical Debt)

**作成日**: 2025年9月30日
**対象**: Backend codebase (130ファイル)
**検出方法**: `grep -r "TODO|FIXME|XXX|HACK|@deprecated" src/`

---

## 📊 サマリー

| カテゴリ | 件数 | 優先度 |
|---------|------|--------|
| **TODO** | 9件 | 中〜高 |
| **FIXME** | 0件 | - |
| **XXX** | 0件 | - |
| **@deprecated** | 0件 | - |
| **合計** | 9件 | - |

---

## 🔴 高優先度（緊急対応推奨）

### なし
現時点で高優先度の技術的負債は検出されていません。

---

## 🟡 中優先度（次スプリントで対応）

### 1. 監査・ログシステムの本番環境対応

**ファイル**: `src/common/audit/audit.service.ts:40`

**内容**:
```typescript
// TODO: In production, send to centralized logging system
```

**問題**:
- 現在はローカルログのみ、本番環境での集中ログシステムへの送信が未実装

**影響範囲**:
- セキュリティ監査、コンプライアンス対応

**推奨対応**:
1. CloudWatch Logs / Datadog等の集中ログシステムを選定
2. Winston/Pino transporterを実装
3. 構造化ログフォーマットを統一

**優先度**: 🟡 中
**推定工数**: 4-6時間
**関連チケット**: governance.yaml - Security baseline

---

### 2. コスト監視の専用テーブル実装

**ファイル**: `src/common/governance/cost-monitor.service.ts:160`

**内容**:
```typescript
// TODO: 将来的に専用監査テーブルへの記録実装
```

**問題**:
- コスト履歴がEvidence.metadataに埋め込まれている
- クエリ・分析が困難

**影響範囲**:
- governance.yaml準拠のコスト制御（15円/生成）
- BI/レポーティング機能

**推奨対応**:
1. Prismaスキーマに`CostAuditLog`テーブル追加
```prisma
model CostAuditLog {
  id            String   @id @default(cuid())
  evidenceId    String
  userId        String
  costBreakdown Json
  performance   Json
  warnings      String[]
  withinLimits  Boolean
  createdAt     DateTime @default(now())
}
```
2. cost-monitor.service.tsのDB保存ロジックを実装
3. 既存のmetadataからデータマイグレーション

**優先度**: 🟡 中
**推定工数**: 6-8時間
**関連チケット**: APP-358 (コスト監視)

---

## 🟢 低優先度（ボトムアップで対応）

### 3. PDF複数生成・ZIP化機能

**ファイル**: `src/modules/pdf-generator/pdf-generator.controller.ts:118`

**内容**:
```typescript
// TODO: 複数PDF生成とZIP化の実装
```

**問題**:
- 単一PDFのみ生成可能、複数ドキュメントの一括生成が未対応

**影響範囲**:
- ユーザビリティ（一括ダウンロード機能）

**推奨対応**:
1. `generateBatch()` エンドポイント実装
2. ArchiverライブラリでZIP圧縮
3. プログレス通知（WebSocket or Polling）

**優先度**: 🟢 低
**推定工数**: 8-10時間
**関連チケット**: 新規チケット作成推奨

---

### 4. Intake機能の永続化対応

**ファイル**: `src/modules/intake/intake.controller.ts`

**内容**:
```typescript
// Line 126: TODO: データベースに保存
// Line 545: TODO: データベースから状態を取得
```

**問題**:
- 解析結果がメモリ上にのみ存在、再起動で消失

**影響範囲**:
- データ永続性、スケーラビリティ

**推奨対応**:
1. Prismaスキーマに`IntakeSession`テーブル追加
2. Redis / PostgreSQL JSONBカラムで中間データ保存
3. セッション管理・有効期限実装

**優先度**: 🟢 低
**推定工数**: 6-8時間
**関連チケット**: APP-240関連

---

### 5. PDFメタデータ抽出の画像検出機能

**ファイル**: `src/modules/intake/services/pdf-extractor.service.ts`

**内容**:
```typescript
// Line 106: hasImages: false, // TODO: 画像検出の実装
// Line 153: // TODO: PDF→画像変換の実装（puppeteer or pdf2pic）
// Line 173: // TODO: PDF→画像変換の実装が必要
```

**問題**:
- PDF内画像の存在検出が未実装
- PDF→画像変換機能が未実装

**影響範囲**:
- OCR処理の精度（画像ベースPDFの処理）
- メタデータの完全性

**推奨対応**:
1. pdf-parseで画像オブジェクト検出
2. pdf2picまたはPuppeteer + pdf-libで画像変換
3. 画像付きPDFの専用処理フロー実装

**優先度**: 🟢 低
**推定工数**: 10-12時間
**関連チケット**: APP-050 (OCR) 拡張

---

### 6. 構造化データのURL生存確認

**ファイル**: `src/evidence/structured-data.service.ts:188`

**内容**:
```typescript
urlStatus: 'ACTIVE' // TODO: URL生存確認
```

**問題**:
- 抽出されたURLの有効性チェックが未実装
- リンク切れURLも「ACTIVE」扱い

**影響範囲**:
- データ品質スコア（qualityAssessment）
- ユーザー体験（無効URLの表示）

**推奨対応**:
1. URLバリデーション（DNS/HTTP HEAD）実装
2. 非同期バッチ処理（大量URL対応）
3. キャッシュ機構（重複チェック回避）
4. Rate limitingで外部サイト負荷軽減

**優先度**: 🟢 低
**推定工数**: 4-6時間
**関連チケット**: APP-051 (構造化データ) 品質向上

---

## 📋 対応優先順位マトリクス

| 項目 | 優先度 | 影響度 | 緊急性 | 工数 | 推奨対応時期 |
|-----|--------|--------|--------|------|------------|
| 1. 監査ログシステム | 🟡 中 | 高 | 中 | 4-6h | Sprint 4 |
| 2. コスト監視テーブル | 🟡 中 | 中 | 中 | 6-8h | Sprint 4 |
| 3. PDF複数生成 | 🟢 低 | 低 | 低 | 8-10h | Backlog |
| 4. Intake永続化 | 🟢 低 | 中 | 低 | 6-8h | Sprint 5 |
| 5. PDF画像検出 | 🟢 低 | 中 | 低 | 10-12h | Sprint 5 |
| 6. URL生存確認 | 🟢 低 | 低 | 低 | 4-6h | Backlog |

---

## 🎯 推奨アクション

### 即時対応（今スプリント）
- なし（緊急度の高い負債なし）

### 次スプリント（Sprint 4）
1. **監査ログシステム** - 本番環境準備として実装
2. **コスト監視テーブル** - governance.yaml準拠のため実装

### バックログ追加
3. PDF複数生成・ZIP化
4. Intake永続化
5. PDF画像検出
6. URL生存確認

---

## 📈 技術的負債の削減計画

### フェーズ1: 基盤整備（Sprint 4）
- [ ] 集中ログシステム導入
- [ ] コスト監視専用テーブル実装
- [ ] 負債削減のKPI設定

### フェーズ2: 機能拡張（Sprint 5）
- [ ] Intake永続化
- [ ] PDF画像検出機能

### フェーズ3: 品質向上（Sprint 6以降）
- [ ] PDF複数生成
- [ ] URL生存確認

---

## 📝 メンテナンス

### 更新ルール
- 新規TODO追加時: このドキュメントを更新
- TODO解決時: 該当項目を削除し、CHANGELOG.mdに記録
- 四半期レビュー: 優先度の見直し

### 次回レビュー予定
**2025年10月末（Sprint 4終了時）**

---

**最終更新**: 2025年9月30日
**レビュー担当**: Backend Team
**承認**: Project Manager