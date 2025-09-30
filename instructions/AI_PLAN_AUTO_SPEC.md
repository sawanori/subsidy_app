# KPI/事業計画 自動生成 要件定義・実装指示書

本書は ai_function.txt に基づき、「取組内容を入力 →（確定申告の数値から現状推測）→ “KPI設定”と“事業計画”を自動生成」を、他の生成AIが安全かつ段階的に実装できるようにするための要件定義書兼指示書です。NestJS + Prisma（backend）と既存フロントエンドに統合する前提で記述します。

## 目的/概要
- ユーザーが「取組内容（自由記述＋タグ）」を入力すると、確定申告書から推定した現状（ベースライン）を用いて、KPIセット（3〜5件）と事業計画ドラフトを自動生成する。
- 生成結果は、引用（確定申告抽出の source_id／Evidence）を付与し、保存・監査可能にする。
- バリデーション/プリフライトに通る品質を満たす（NG時はAutoFix案を提示）。

## 前提/スコープ
- 前提（既存機能）
  - 確定申告書アップロード→抽出（OCR/抽出結果）は動作済み。
  - Application/Plan/KPI/Evidence などの基本モデルは Prisma に存在。
  - AIアシスタントモジュール（backend/src/modules/ai-assistant）は存在し、OpenAI未設定時はモック応答を返す。
- 本実装のスコープ
  - バックエンドAPI（/v1/baseline/build, /v1/plan/auto, /v1/validate/kpis, /v1/validate/text）
  - ベースライン推定、意図正規化、KPI生成/検証、事業計画生成、テキスト検証のサービス群
  - 監査ログ（引用・プロンプト・モデル情報）の残し込み
- 非スコープ
  - PDF→画像ラスタライズの新規実装（必要時は別チケット）
  - クラウドOCRの本実装（現状はモック）

## ゴールと入出力
- 入力（ユーザー）
  - 取組内容（自由記述＋選択タグ）
  - 任意：対象期間（月数）、予算上限、ターゲット市場/顧客像、既存チャネル
- 入力（自動）
  - 確定申告書から推測した現状値（売上・粗利率・販促費率 等）、年次→月次の平準化
- 出力
  - KPIセット（3〜5件）: name, baseline, target, unit, method, frequency, rationale, sourceRef
  - 事業計画ドラフト: background → 課題 → 解決戦略（テーマ→施策→タスク）→ 実施計画（WBS）→ 費用対効果 → リスク対策
  - すべてに引用ID（tax:source_id, evidence_id）添付

## 全体アーキテクチャ（バックエンド主導）
- モジュール構成（新規）: AutoPlanModule（仮）
  - Controller: AutoPlanController（/v1 配下のエンドポイント）
  - Services:
    - BaselineBuilderService（現状推定）
    - IntentStructurerService（取組内容→テーマ/タグ正規化）
    - KPIGeneratorService（KPI候補生成）
    - KPIValidatorService（KPI妥当性検証/AutoFix案）
    - PlanGeneratorService（事業計画生成/WBS雛形）
    - TextPreflightService（文字数/禁則/引用チェックとFix案）
  - AuditService（監査JSON保存: 引用ID・プロンプト・モデル名・ハッシュ）
- 既存統合ポイント
  - AIAssistantService 経由でプロンプト生成・LLM呼び出し（未設定時はモック）
  - Prisma: Application/KPI/Plan 等への保存
  - Evidence: 引用や外部根拠の参照

## API仕様（最小セット）
1) POST /v1/baseline/build
- req: { application_id: string }
- res: {
  baselines: {
    sales_monthly: { value: number|null, source: string|null, confidence: number },
    gross_margin: { value: number|null, source: string|null, confidence: number },
    ad_ratio: { value: number|null, source: string|null, confidence: number },
    customers_monthly: { value: number|null, source: string|null, confidence: number, note?: string }
  }
}

2) POST /v1/plan/auto
- req: {
  application_id: string,
  initiatives: [{ text: string, tags: string[] }],
  constraints?: { months?: number, budget_max?: number },
  prefer?: { kpi_count?: number }
}
- res: {
  kpis: Array<{ name: string, baseline?: number, target: number, unit: string, method: string, frequency: string, rationale?: string, sourceRef?: string }>,
  plan: {
    background: string,
    solution: { themes: Array<{ name: string, measures: Array<{ name: string, tasks: string[] }> }> },
    schedule: { wbs: Array<{ task: string, start: string, end: string }> }
  },
  citations: Array<{ type: 'source'|'evidence', id: string }]
}

3) POST /v1/validate/kpis
- req: { kpis: any[], constraints?: { months?: number } }
- res: { ok: boolean, warnings: any[], fixes: any[] }

4) POST /v1/validate/text
- req: { field: 'background'|'solution'|'schedule'|'summary', text: string, ruleset?: string }
- res: { ok: boolean, errors: any[], fixes: Array<{ type: 'summarize'|'bulletize'|'shorten', new_text: string }> }

- エラーモデル: 200/400/422 を中心に、500は原則返さない（空/デフォルト値で返却）。

## データモデル（Prisma）差分
- 追加: Application.baselines Json?（月次売上、粗利率、広告費率等と source/confidence を保持）
  - 影響ファイル: backend/prisma/schema.prisma（migration含む）
- 既存の KPI/Plan を活用:
  - KPI: name/unit/baselineValue/targetValue/measurementMethod/rationale をマッピング
  - Plan: background/solution/schedules を既存構造に反映（必要に応じて JSON→Action/Scheduleへ分解）

## 生成ロジック仕様
- ベースライン推定
  - 売上（月）= 年商 ÷ 12（季節性は無視）
  - CVRベースライン: EC有りの場合は仮 1.2%（不明は“未観測”）
  - 客単価 = 売上 ÷ 顧客数推定（不明はKPIで計測必須）
  - すべてに source（tax_return:field_id など）と confidence を付与
- KPI生成ルール
  - 件数系: target = baseline × (1 + α)。α上限: 3ヶ月≤+30%、6ヶ月≤+70%、12ヶ月≤+120%（業種係数で補正可）
  - 率系（CVR/リピ率）: absolute lift の上限（例: CVR +0.6pp/6ヶ月）
  - 支出効率（CPA/ROAS）: 予算上限から逆算
  - method は辞書（GA4/POS/CRM/問い合わせ台帳）から付与
- 事業計画生成
  - 背景（市場RAG 1～2本引用）→課題（ベースライン差分）→解決戦略（テーマ→施策→タスク）
  - 各施策に kpi_links を必須付与
  - 予算上限→施策別配分（広告/制作/運用）
  - スケジュール: 依存/並行化を配慮した6～12ヶ月WBS雛形

## バリデーション/プリフライト
- KPI
  - 件数系: target ≥ baseline、増加率は期間上限内
  - 率系: 0 ≤ baseline,target ≤ 100、絶対上昇幅上限
  - method が辞書に一致
- 文章
  - 文字数・禁則・禁止語、引用必須（ゼロ引用はNG）
- 整合
  - 施策→KPIリンク未設定はエラー
  - 予算超過・期間超過は AutoFix（配分再計算/ペース分割）

## プロンプト設計（要点）
- KPI生成プロンプト
  - System: 制度ID、文字数上限、出力スキーマ（JSON固定）
  - User: 取組内容、ベースライン（ソース付）、期間/予算、単位辞書
  - Tools: KPI禁止例（過大/未計測/曖昧単位）
  - 要求: 各KPIに rationale と measurement.method を必須、引用IDを含める
- 事業計画生成プロンプト
  - 背景は引用2本以内、課題はベースライン差分、施策はKPIリンク必須、WBSは依存考慮
  - 文字数/ページ制約は preflight rules を参照
- 実装: AIAssistantService を経由してテンプレ＋変数で組み立て、JSON優先で解釈

## 実装タスク（順序）
1. Prisma 変更
   - Application に baselines Json? を追加、migrate
2. Backend API 追加（新規モジュール: AutoPlanModule）
   - Controller: /v1/baseline/build, /v1/plan/auto, /v1/validate/kpis, /v1/validate/text
   - DTO/Swagger 定義、エラーハンドリング（500を避け、空やFix案で返す）
3. BaselineBuilderService
   - Application/Evidence/抽出結果から extracted_fields を取得
   - 年次→月次、和暦→西暦、千円→円 変換、欠損は推定/未観測で埋め
   - source/confidence を付与、Application.baselines に保存
4. IntentStructurerService
   - 自由文をテーマ（新規獲得/EC改善/LTV向上/ローカルSEO）に正規化、タグ抽出
5. KPIGeneratorService + KPIValidatorService
   - ベースライン×期間×ルールでSMART指標を設計
   - 妥当性チェック→NGは Fix案（期間延長/段階目標/目標幅調整）
6. PlanGeneratorService
   - 背景（RAG引用）→課題→解決戦略→施策→タスク→WBS雛形
   - KPI整合（kpi_links）を強制
7. TextPreflightService
   - 文字数・禁則・引用・ページ制約を検証
   - NG時は summarize/bulletize/shorten のFix案
8. 保存/監査
   - plan（background/solution）と KPI を保存
   - 監査JSON：引用ID・プロンプト・モデル名・ハッシュ・timestamp を保存
9. E2E 縦スライス
   - 「入力→生成→検証→プレビュー」まで一気通し

## DTO 例（TypeScript）
```ts
// /v1/plan/auto req
export interface AutoPlanRequestDto {
  application_id: string;
  initiatives: { text: string; tags: string[] }[];
  constraints?: { months?: number; budget_max?: number };
  prefer?: { kpi_count?: number };
}

// /v1/plan/auto res（要点のみ）
export interface AutoPlanResponseDto {
  kpis: Array<{
    name: string;
    baseline?: number;
    target: number;
    unit: string;
    method: string;
    frequency: string;
    rationale?: string;
    sourceRef?: string;
  }>;
  plan: {
    background: string;
    solution: { themes: Array<{ name: string; measures: Array<{ name: string; tasks: string[] }>; }> };
    schedule: { wbs: Array<{ task: string; start: string; end: string }> };
  };
  citations: Array<{ type: 'source' | 'evidence'; id: string }>;
}
```

## 監査・ロギング
- 監査JSON（例）
```json
{
  "application_id": "app_xxx",
  "citations": [{"type":"source","id":"tax:src_abc"}],
  "prompt_hash": "sha256:...",
  "model": "gpt-4o-mini",
  "timestamp": "2025-09-27T12:00:00Z"
}
```
- 失敗時も 500 は避け、空データやFix案で返す。サーバーログには warn で記録。

## テスト/受入基準
- 縦スライスE2E: 入力→生成→検証→プレビューが成功
- KPI検証: NG→Fix案→再検証OKのループ
- ゴールデン案件で現実的な目標（過大/過少を自動検出）
- 監査JSONに引用・ベースラインソースが必ず残る

## 非機能
- パフォーマンス: 生成APIはタイムアウト/キュー化想定（将来）
- 可用性: 生成AI未設定時はモックで動作（AIAssistantServiceの既存仕様を活用）
- セキュリティ: 入力サニタイズ、レート制限、監査ログ

## 環境変数/設定（OpenAI利用）
- 生成AIのAPIキーは当面 OpenAI を使用
  - OPENAI_API_KEY: OpenAIのAPIキー（必須）
  - OPENAI_MODEL: 例) gpt-4o-mini（未設定時は既定モデルを使用）
  - OPENAI_MAX_TOKENS: 例) 4000（任意）
  - OPENAI_TEMPERATURE: 例) 0.7（任意）
- backend の AIAssistantService は OPENAI_API_KEY が未設定の場合、自動でモック応答にフォールバックする。
- 推奨: 開発環境では .env に設定し、運用環境はSecret/Envで安全に注入。

## 実装上の注意
- 例外で 500 を返さない方針（空/既定値/モックで継続）。
- OCRや抽出が空でも落とさない（undefinedガード徹底）。
- すべての生成出力に citations を付与する（ゼロ引用はバリデーションNG）。

## 作業ブレークダウン（他AI向け）
1. Prismaに baselines 追加 → migration → Repository実装
2. AutoPlanModule生成 → Controller/DTO/Swagger
3. BaselineBuilderService 実装（抽出値の正規化/平準化/推定/保存）
4. IntentStructurer/KPIGenerator/KPIValidator 実装（ルール＋LLM）
5. PlanGenerator 実装（RAG引用とKPI整合）
6. TextPreflight 実装（ルールとFix案）
7. 保存/監査 実装（Plan/KPI作成、監査JSON）
8. E2Eテスト/スタブデータでの検証

## 完了の定義（DoD）
- API 4本がSwaggerに掲載され、モック/本実装ともに200で応答。
- 代表的な入力でKPI 3〜5件と事業計画が生成され、/validate でOKまたはFix案提示。
- Applicationに baselines 保存、Plan/KPI がDB登録、監査JSONが出力。
- 500 が発生しない（落とさない）。

---
本書の内容のみで、他の生成AIが安全に実装を進められるようにしてください。疑義が出た場合は、まずスタブ/モックで縦スライスを完成させ、その後に詳細実装を行う方針とします。

## 現状の縦スライス実装（実装済み）
- 目的: まずはAPIが200で返り、モックでも一連の流れが動く状態を提供

- 追加モジュール/ファイル
  - AutoPlanModule: backend/src/modules/auto-plan/auto-plan.module.ts
  - Controller: backend/src/modules/auto-plan/auto-plan.controller.ts（/v1配下）
  - DTO: backend/src/modules/auto-plan/dto/auto-plan.dto.ts
  - Services:
    - BaselineBuilderService: backend/src/modules/auto-plan/services/baseline-builder.service.ts
    - IntentStructurerService: backend/src/modules/auto-plan/services/intent-structurer.service.ts
    - KPIGeneratorService: backend/src/modules/auto-plan/services/kpi-generator.service.ts
    - KPIValidatorService: backend/src/modules/auto-plan/services/kpi-validator.service.ts
    - PlanGeneratorService: backend/src/modules/auto-plan/services/plan-generator.service.ts（AIAssistant連携、未設定時モック）
    - TextPreflightService: backend/src/modules/auto-plan/services/text-preflight.service.ts
    - AuditService: backend/src/modules/auto-plan/services/audit.service.ts
  - App組込: backend/src/app.module.ts に AutoPlanModule 追加

- 提供API（暫定）
  - POST /v1/baseline/build
    - 入: { application_id }
    - 出: { baselines: { sales_monthly, gross_margin, ad_ratio, customers_monthly } }（保守的推定のモック）
  - POST /v1/plan/auto
    - 入: { application_id, initiatives:[{text,tags}], constraints:{months,budget_max}, prefer:{kpi_count} }
    - 出: { kpis[], plan{background,solution,schedule,citations}, citations[], warnings[], fixes[] }
    - 流れ: Baseline→Intent→KPI生成→KPI検証（警告/修正案）→事業計画生成（AIAssistant/モック）→監査記録
  - POST /v1/validate/kpis: KPIの成長率/範囲/測定方法チェック（warnings/fixes返却）
  - POST /v1/validate/text: 文字数/禁止語などの簡易プリフライト（fix案返却）

- 動作上の前提
  - DB書き込みは未実装（Prismaの baselines 追加後に対応予定）
  - Baseline は推定のモック値を返す（抽出連携は今後実装）
  - OpenAIは設定済みなら利用、未設定時はAIAssistantのモックが働く

- 動作確認例
  - POST http://localhost:3001/v1/baseline/build
    - Body: {"application_id":"app_demo_1"}
  - POST http://localhost:3001/v1/plan/auto
    - Body: {"application_id":"app_demo_1","initiatives":[{"text":"ECのCVR改善と新規獲得強化","tags":["EC","CVR","新規獲得"]}],"constraints":{"months":6,"budget_max":1500000},"prefer":{"kpi_count":4}}

- 今後の拡張（本仕様と整合）
  - Prismaに Application.baselines を追加し保存
  - intake抽出結果から実ベースラインを算出・引用ID付与
  - 事業計画プロンプト/テンプレ強化、RAG引用
  - PDF→画像ラスタライズ（スキャンPDFの実OCR対応）
