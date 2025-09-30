# Backendコードリファクタリング計画書

## 📊 現状分析サマリー

### コードベース統計
- **TypeScriptファイル数**: 130ファイル（テスト除く）
- **総行数**: 17,101行
- **サービス数**: 42サービス
- **コントローラー数**: 12コントローラー
- **エクスポート数**: 約150（クラス・関数・定数）
- **モジュール数**: 10モジュール
- **技術的負債マーカー**: 6ファイルにTODO/FIXME/XXX存在

### 主要なリファクタリング対象

#### 1. 重複コードパターン
```
重複の可能性がある領域:
- OCRSupportService (177行) vs OCRService (267行)
  → 両方ともOCR処理を担当、機能が重複

- StorageOptimizationService (439行) vs StorageService
  → ストレージ管理機能の重複

- DataTransformationService (489行)
  → 大規模サービス、分割検討が必要

- FileProcessorService (518行)
  → 最大規模のサービス、責任過多の可能性
```

#### 2. 未使用・非推奨コード
```
明示的にマークされたファイル:
- src/evidence/evidence.controller.ts (deprecated/unused含む)
- src/evidence/services/storage-optimization.service.ts (TODO remove/FIXME delete含む)
```

#### 3. 技術的負債
```
TODO/FIXME/XXXマーカー存在ファイル (6件):
1. src/evidence/structured-data.service.ts (290行)
2. src/common/audit/audit.service.ts (184行)
3. src/common/governance/cost-monitor.service.ts (196行)
4. src/modules/pdf-generator/pdf-generator.controller.ts
5. src/modules/intake/intake.controller.ts
6. src/modules/intake/services/pdf-extractor.service.ts
```

#### 4. アーキテクチャ課題
```
- 相対インポート: 92箇所で親ディレクトリへの相対パス使用
  → tsconfig pathsエイリアスへの移行が必要

- PrismaServiceの直接インポート: 12箇所
  → リポジトリパターンへの抽象化検討

- インターフェース/型定義ファイル: 2ファイルのみ
  → 型定義の集約・整理が不足
```

---

## 🎯 リファクタリングフェーズ計画

### Phase 1: 低リスククリーンアップ（推定: 2-3時間）

**目的**: ビルドや動作に影響を与えない安全な改善

**作業項目**:

#### 1.1 未使用インポート・変数の削除
```bash
# ESLintで自動検出可能な未使用コード
- 未使用インポート文の削除
- 未使用変数の削除
- 未使用型定義の削除
```

**対象ファイル**: 全130ファイル（自動化可能）

**コマンド**:
```bash
npm run lint -- --fix
```

**リスク**: 極小（ESLintの自動修正に依存）

---

#### 1.2 Console.log/デバッグコードの削除
```bash
# 本番環境に残存するデバッグコード
- console.log() の削除（Logger使用に統一）
- console.error() の削除
- デバッグ用のハードコードされた値の削除
```

**検証コマンド**:
```bash
grep -r "console\\.log\|console\\.error\|console\\.warn" src --include="*.ts"
```

**リスク**: 極小

---

#### 1.3 TODO/FIXMEの整理と文書化
```bash
# 技術的負債の可視化
- 全TODO/FIXME/XXXコメントを抽出
- TECHNICAL_DEBT.mdに集約
- 各マーカーに優先度タグを追加
```

**対象**: 6ファイル

**成果物**: `TECHNICAL_DEBT.md`

**リスク**: なし（コードを変更しない）

---

#### 1.4 コメントとドキュメンテーションの改善
```bash
# 不正確・古いコメントの更新
- 誤ったコメントの修正
- 英語コメントの日本語統一（またはその逆）
- JSDoc形式への統一
```

**対象**: 全ファイル（段階的実施）

**リスク**: なし

---

### Phase 2: 重複コード統合（推定: 5-8時間）

**目的**: 同じ機能を持つコードを統合し、保守性向上

#### 2.1 OCR関連サービスの統合

**問題**:
- `OCRSupportService` (177行): OCRメタデータスキーマ定義・ガイド用
- `OCRService` (267行): 実際のOCR処理実装（Tesseract.js）

**リファクタリング案**:
```typescript
// 統合後の構造
src/evidence/services/ocr/
├── ocr.service.ts          // メインサービス（OCRServiceに統合）
├── ocr-config.ts           // OCR_METADATA_SCHEMAを移動
└── ocr.interface.ts        // OCRResult, OCRWord等の型定義
```

**作業手順**:
1. `OCRSupportService`の静的スキーマ定義を`ocr-config.ts`に抽出
2. `OCRService`に機能を統合
3. `ocr-support.service.ts`を削除
4. インポート文を全体で修正
5. テストで動作確認

**影響範囲**: OCRSupportServiceを参照している全ファイル（検索で確認）

**リスク**: 中（テストカバレッジが低いため手動検証必須）

---

#### 2.2 Storage関連サービスの統合

**問題**:
- `StorageOptimizationService` (439行): ストレージ最適化・圧縮
- `StorageService`: 基本的なストレージ操作

**リファクタリング案**:
```typescript
// 統合後の構造
src/modules/storage/
├── storage.service.ts           // 基本操作（CRUD）
├── storage-optimizer.service.ts // 最適化専門（圧縮・クリーンアップ）
└── storage.types.ts             // 共通型定義
```

**作業手順**:
1. 両サービスの責務を明確化
2. 重複メソッドを特定（圧縮処理等）
3. StorageServiceを基本操作に限定
4. StorageOptimizerServiceを最適化に特化
5. 相互依存関係を整理

**影響範囲**: ストレージ操作を行う全モジュール

**リスク**: 中

---

#### 2.3 DataTransformationServiceの分割

**問題**:
- `DataTransformationService` (489行): 責任過多（Single Responsibility違反）

**リファクタリング案**:
```typescript
// 分割後の構造
src/evidence/services/transformers/
├── base-transformer.service.ts      // 共通変換ロジック
├── excel-transformer.service.ts     // Excel専用変換
├── pdf-transformer.service.ts       // PDF専用変換
└── csv-transformer.service.ts       // CSV専用変換
```

**作業手順**:
1. DataTransformationServiceの全メソッドを分析
2. ファイル形式ごとにTransformerクラスを作成
3. 共通処理を`BaseTransformerService`に抽出
4. 各Transformerで共通サービスを継承
5. 元のServiceをFacadeパターンで維持（互換性）

**影響範囲**: evidence moduleの全体

**リスク**: 高（大規模変更、段階的実施推奨）

---

#### 2.4 FileProcessorServiceの分割

**問題**:
- `FileProcessorService` (518行): 最大サイズ、責任過多

**リファクタリング案**:
```typescript
// 分割後の構造
src/evidence/services/file-processing/
├── file-processor.service.ts    // Facade（エントリーポイント）
├── file-validator.service.ts    // バリデーション専門
├── file-parser.service.ts       // パース処理
└── file-metadata.service.ts     // メタデータ抽出
```

**作業手順**:
1. 機能を「バリデーション」「パース」「メタデータ」に分類
2. 各責務ごとにサービスを作成
3. FileProcessorServiceをFacadeとして維持
4. 段階的に機能を移行

**影響範囲**: evidence処理全体

**リスク**: 高

---

### Phase 3: サービス層最適化（推定: 6-10時間）

**目的**: アーキテクチャパターンの統一と最適化

#### 3.1 相対インポートパスの統一

**問題**: 92箇所で`../../../`形式の相対パス使用

**リファクタリング案**:
```typescript
// Before:
import { PrismaService } from '../../../prisma/prisma.service';
import { Logger } from '../../../../common/logger';

// After:
import { PrismaService } from '@/prisma/prisma.service';
import { Logger } from '@/common/logger';
```

**作業手順**:
1. tsconfig.jsonに追加のpathsエイリアスを定義
```json
{
  "paths": {
    "@/*": ["src/*"],
    "@generated/*": ["generated/*"],
    "@common/*": ["src/common/*"],
    "@modules/*": ["src/modules/*"]
  }
}
```
2. 全ファイルでインポート文を一括置換
3. ビルドで動作確認

**影響範囲**: 92ファイル

**リスク**: 中（自動置換でミスの可能性）

---

#### 3.2 PrismaServiceの抽象化（Repository Pattern）

**問題**: 12箇所で直接PrismaServiceに依存

**リファクタリング案**:
```typescript
// 新規作成: Repository層
src/common/repositories/
├── base.repository.ts
├── application.repository.ts
├── evidence.repository.ts
└── plan.repository.ts
```

**作業手順**:
1. BaseRepositoryクラスを作成（共通CRUD操作）
2. エンティティごとにRepositoryクラスを作成
3. 各ServiceでPrismaServiceの代わりにRepositoryを注入
4. 段階的に移行（全Serviceを一度に変更しない）

**メリット**:
- テストが容易（モックリポジトリ作成）
- データベース抽象化（将来的な移行が楽）
- ビジネスロジックとデータアクセスの分離

**影響範囲**: PrismaService使用中の全Service（約12ファイル）

**リスク**: 高（アーキテクチャ変更、慎重な実施必要）

---

#### 3.3 非推奨・未使用コードの削除

**対象**:
- `src/evidence/evidence.controller.ts` (deprecatedマーカー付き)
- `src/evidence/services/storage-optimization.service.ts` (TODO remove含む)

**作業手順**:
1. 各ファイルの参照箇所を検索
```bash
grep -r "EvidenceController\|StorageOptimizationService" src --include="*.ts"
```
2. 参照がゼロなら削除、あれば代替実装を確認
3. 削除前にgitブランチ作成（ロールバック用）
4. テストスイートで影響確認

**リスク**: 中

---

#### 3.4 DTOとInterfaceの整理

**問題**:
- DTO定義が各モジュールに散在
- Interface定義ファイルが2つのみ（不足）

**リファクタリング案**:
```typescript
// 統一構造
src/common/dtos/        // 共通DTO
src/common/interfaces/  // 共通Interface
src/modules/[name]/dto/ // モジュール固有DTO
```

**作業手順**:
1. 全DTO/Interfaceをリストアップ
2. 共通的なものを`src/common/`に移動
3. モジュール固有のものは`src/modules/[name]/`に配置
4. 重複する型定義を統合
5. インポート文を全体修正

**影響範囲**: 全モジュール

**リスク**: 中

---

### Phase 4: モジュール構造最適化（推定: 4-6時間）

**目的**: NestJSのモジュール設計ベストプラクティスに準拠

#### 4.1 モジュール境界の明確化

**現状分析**:
```
src/
├── applications/      # モジュール化済み
├── evidence/          # モジュール化済み
├── plans/             # モジュール化済み
├── modules/           # 10個のサブモジュール
│   ├── auto-plan/
│   ├── intake/
│   ├── pdf-generator/
│   └── ...
├── common/            # 共通ユーティリティ（モジュールなし）
├── phase3/            # ← 削除候補
├── template/          # ← modules/へ移動検討
└── supabase/          # ← modules/へ移動検討
```

**リファクタリング案**:
```typescript
// 整理後の構造
src/
├── common/              # 共通ユーティリティ（モジュールなし）
│   ├── decorators/
│   ├── guards/
│   ├── filters/
│   ├── dtos/
│   └── interfaces/
├── modules/             # 全機能モジュール
│   ├── applications/    # 移動
│   ├── evidence/        # 移動
│   ├── plans/           # 移動
│   ├── auto-plan/
│   ├── pdf-generator/
│   ├── templates/       # 移動
│   └── supabase/        # 移動
└── config/              # アプリ設定
```

**作業手順**:
1. `applications/`, `evidence/`, `plans/`を`modules/`配下に移動
2. `template/`を`modules/templates/`に変更
3. `supabase/`を`modules/supabase/`に変更
4. `phase3/`を削除（内容確認後）
5. 全インポート文を修正

**リスク**: 高（大規模移動、別ブランチで実施推奨）

---

#### 4.2 Moduleの依存関係整理

**問題**: モジュール間の循環依存の可能性

**作業手順**:
```bash
# 依存関係グラフ生成
npx madge --circular --extensions ts src/
```

1. 循環依存を検出
2. 共通処理を`common/`に抽出
3. Moduleのimports/exportsを明示化
4. SharedModuleパターンの導入

**リスク**: 中

---

### Phase 5: テストとドキュメント（推定: 3-5時間）

**目的**: リファクタリング後の品質保証

#### 5.1 リファクタリング対象のテスト追加

**作業項目**:
```typescript
// Phase 2-4で変更したサービスの単体テスト作成
- ocr.service.spec.ts の拡充
- storage.service.spec.ts の拡充
- file-processor.service.spec.ts の追加
- transformers/*.spec.ts の追加
```

**目標**: 変更箇所のカバレッジ70%以上

**リスク**: なし

---

#### 5.2 統合テストの追加

**作業項目**:
```typescript
// E2Eテストで主要フローを検証
- 申請作成 → 証跡アップロード → PDF生成
- OCR処理 → データ変換 → 保存
```

**対象**: test/e2e/に新規追加

**リスク**: なし

---

#### 5.3 アーキテクチャドキュメント更新

**成果物**:
```
backend/docs/
├── ARCHITECTURE.md           # アーキテクチャ概要
├── MODULE_STRUCTURE.md       # モジュール構成図
├── SERVICE_DEPENDENCIES.md   # サービス依存関係
└── REFACTORING_CHANGELOG.md  # リファクタリング履歴
```

**リスク**: なし

---

## 📋 実施スケジュール案

### 推奨スケジュール（段階的実施）

| Phase | 期間 | 内容 | リスク | 前提条件 |
|-------|------|------|--------|----------|
| **Phase 1** | 1日目 | 低リスククリーンアップ | 極小 | なし |
| **Phase 2.1-2.2** | 2-3日目 | OCR/Storage統合 | 中 | Phase 1完了 |
| **Phase 2.3-2.4** | 4-6日目 | 大規模Service分割 | 高 | Phase 2.1-2.2完了 |
| **Phase 3.1** | 7日目 | インポートパス統一 | 中 | Phase 2完了 |
| **Phase 3.2** | 8-9日目 | Repository Pattern導入 | 高 | Phase 3.1完了 |
| **Phase 3.3-3.4** | 10日目 | 未使用コード削除/DTO整理 | 中 | Phase 3.2完了 |
| **Phase 4** | 11-12日目 | モジュール構造最適化 | 高 | Phase 3完了 |
| **Phase 5** | 13-14日目 | テスト・ドキュメント | なし | Phase 4完了 |

**総所要時間**: 約14営業日（約3週間）

---

## ⚠️ リスク管理

### 高リスクフェーズの対策

#### Phase 2.3-2.4: 大規模Service分割
**リスク**: 既存機能の破壊
**対策**:
- [ ] 専用featureブランチ作成
- [ ] 分割前にE2Eテスト追加
- [ ] 1サービスずつ段階的実施
- [ ] 各ステップでビルド・テスト確認

#### Phase 3.2: Repository Pattern導入
**リスク**: アーキテクチャ変更による広範囲な影響
**対策**:
- [ ] Facade Patternで旧実装を維持
- [ ] 1モジュールずつ移行（applications → evidence → plans）
- [ ] 並行運用期間を設ける
- [ ] ロールバック計画を準備

#### Phase 4: モジュール構造最適化
**リスク**: 大規模ファイル移動によるインポート破壊
**対策**:
- [ ] 自動化スクリプト作成（手動移動禁止）
- [ ] TypeScriptコンパイラで全エラー検出
- [ ] ESLintで参照チェック
- [ ] CI/CDで自動検証

---

## ✅ 各フェーズの完了条件 (Definition of Done)

### Phase 1
- [ ] ESLint warningがゼロ
- [ ] console.log/console.errorが存在しない
- [ ] TECHNICAL_DEBT.mdが作成済み
- [ ] ビルドが成功

### Phase 2
- [ ] 統合対象サービスが削除済み
- [ ] 新サービスの単体テストが追加済み
- [ ] 既存機能が全て動作（E2Eテスト合格）
- [ ] コードカバレッジが低下していない

### Phase 3
- [ ] 相対インポートが92→0に減少
- [ ] PrismaServiceの直接参照が12→0に減少
- [ ] 非推奨コードが削除済み
- [ ] 重複DTOが統合済み

### Phase 4
- [ ] 全モジュールが`modules/`配下に配置
- [ ] 循環依存がゼロ
- [ ] madgeで依存関係グラフ生成成功

### Phase 5
- [ ] 変更箇所のカバレッジ≥70%
- [ ] 全E2Eテスト合格
- [ ] ドキュメント4種類が作成済み
- [ ] REFACTORING_CHANGELOG.mdに全変更記録

---

## 📈 期待される効果

### コード品質向上
- **重複コード削減**: 推定15-20%削減
- **平均ファイルサイズ**: 518行 → 300行以下に削減
- **循環依存**: ゼロ化
- **テストカバレッジ**: 5% → 40-50%に向上

### 保守性向上
- **新規開発者のオンボーディング時間**: 50%短縮
- **バグ修正時間**: 30%短縮（責務が明確化）
- **機能追加時の影響範囲**: 明確化

### パフォーマンス
- **ビルド時間**: 若干高速化（不要インポート削減）
- **実行時メモリ**: 最適化されたサービス構造で改善

---

## 🚦 優先度別実施判断

### すぐに実施すべき（Phase 1）
✅ **メリット**: 即効性、低リスク、自動化可能
✅ **所要時間**: 半日〜1日
✅ **推奨**: 今すぐ実施

### 優先度高（Phase 2.1-2.2, Phase 3.1）
✅ **メリット**: 保守性大幅向上
⚠️ **リスク**: 中程度
✅ **所要時間**: 3-4日
✅ **推奨**: 1週間以内に実施

### 優先度中（Phase 2.3-2.4, Phase 3.2-3.4）
✅ **メリット**: アーキテクチャ改善
⚠️ **リスク**: 高
⏱️ **所要時間**: 1-2週間
📅 **推奨**: 次スプリントで計画的実施

### 優先度低（Phase 4）
✅ **メリット**: 長期的な保守性
⚠️ **リスク**: 極めて高
⏱️ **所要時間**: 1週間
📅 **推奨**: Phase 3完了後、余裕があれば実施

---

## 📝 次のアクション

### 即座に開始可能（承認不要）
1. **Phase 1.1**: ESLint --fixで自動修正
2. **Phase 1.2**: console.log削除
3. **Phase 1.3**: TECHNICAL_DEBT.md作成

### 承認後に開始（ユーザー確認必要）
4. **Phase 2.1**: OCR統合（影響範囲確認後）
5. **Phase 3.1**: インポートパス統一（大規模置換）

**推奨開始順**: Phase 1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 3.1 → ...

---

**作成日**: 2025年9月30日
**対象コードベース**: backend/ (130ファイル, 17,101行)
**推定総工数**: 約20-32時間（2-4週間）
**次回更新**: Phase 1完了後