## AI Implementation Handoff (持続化補助金・MVP)

目的: 他の生成AIが安全に作業を引き継げるよう、現時点の進捗・影響範囲・次の実装手順・検証方法を明記します。

### 1. スコープ固定
- 対応制度を「小規模事業者持続化補助金（schemeId: jizokuka-2025-v1）」に限定。
- 既存機能に影響が出ないよう、新規エンドポイントとモジュールは追加のみで既存コードは未改変（差し替え無し）。

### 2. このコミットで追加/変更したもの
- openapi.yaml
  - 新タグ: draft, charts
  - 新API: POST /draft, POST /research/summarize, POST /charts/render, POST /validate/plan
  - スキーマ: DraftRequest/Response, ResearchSummarizeRequest/Response, ChartRenderRequest/Response, PlanValidateRequest
  - 例示の制度IDを jizokuka-2025-v1 に統一（文中の例含む）
- サーバーコード（NestJS; スタブのみ）
  - src/modules/draft/{draft.module.ts,draft.controller.ts,draft.service.ts}
  - src/modules/charts/{charts.module.ts,charts.controller.ts,charts.service.ts}
  - src/modules/validate/{validate.module.ts,validate.controller.ts,validate.service.ts}
  - src/modules/research/research.controller.ts に summarize を追加
  - src/modules/research/research.service.ts に summarize を追加
  - src/app.module.ts に DraftModule/ChartsModule/ValidateModule を登録
- ドキュメント
  - site-renew.md（設計書・スコープを持続化に固定）

### 3. 影響範囲と安全性（悪影響が起きない状態）
- 既存のルートやモジュールを削除・変更していません。新規のルート追加のみ。
- DBスキーマ変更なし。マイグレーション不要。
- 新規APIはすべてスタブ実装（固定/簡易レスポンス）で、副作用なし。
- ビルド確認済み（`npm run build`）。

### 4. 次の実装手順（他AI向け）
1) DraftService の本実装
   - 役割: 初期入力をもとに、背景/課題解決/5W1H/KPI/ロードマップ/予算/体制/リスク/差別化を一括生成。
   - 方針: RAG（制度要件/様式）＋LLMの段階生成。出典付与と再計算性を確保。
   - 必要ENV: `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`（例: gpt-4o-mini など）
   - 参照: site-renew.md の API契約（DraftResponse）を厳守。

2) Research summarize の実装
   - 役割: 業界/地域/キーワードから公開統計を要約し、sources/datasets を返却。
   - MVP: e-Stat/省庁レポートの静的JSON→要約でも可（ネットアクセスなしを想定）。
   - 返却: summary/sources/datasets（グラフ用に x,y 配列や年度・値のタプル）。

3) ChartsService の実装
   - 役割: Chart.js（chartjs-node-canvas）でPNG/SVG生成。
   - 入力: ChartRenderRequest（タイトル、軸ラベル、データ、フッター出典）。
   - 出力: ChartRenderResponse（content_type, base64）。

4) ValidateService の拡張
   - ルール: 持続化補助金の様式/語数（セクション別）、予算整合（内訳合計=総額）、補助率上限、スケジュール期間、出典必須。
   - 返却: ValidationResponse（errors/warnings/suggestions/stats）。

5) PDFエクスポート連携（任意/MVP+）
   - Handlebarsテンプレを作成し、puppeteerでPDF化。
   - セクション流し込みと脚注（出典）対応。

### 5. 受け入れ基準（MVP）
- POST /draft で草案一括生成（全セクションが埋まる）。
- POST /research/summarize で summary/sources/datasets を返却。
- POST /charts/render で出典フッター付きPNG/SVGを返却。
- POST /validate/plan で語数・数値・出典チェックが行える。
- site-renew.md の要件を満たすこと（スコープ=持続化）。

### 6. 動作確認（スタブ状態）
- 草案: `POST /draft`
- 調査要約: `POST /research/summarize`
- 図表: `POST /charts/render`
- 検証: `POST /validate/plan`
各サンプルの curl は site-renew.md の例を参照（schemeId は jizokuka-2025-v1）。

### 7. ロールバック/無効化方法
- 一時無効化: `src/app.module.ts` の `DraftModule`, `ChartsModule`, `ValidateModule` を imports から外す。
- ルートブロック: コントローラの `@Controller()` をコメントアウトでも可。
- 完全戻し: `openapi.yaml` の該当パス/スキーマを削除（またはPR差分をRevert）。

### 8. 環境変数（今後使用）
```
LLM_PROVIDER=openai
LLM_API_KEY=xxxx
LLM_MODEL=gpt-4o-mini
```
現状コードはENV未参照（スタブ）。本実装時に `DraftService` から参照する想定。

### 9. ファイル配置と責務
- draft/ … 草案生成のオーケストレーション
- research/ … 外部データ要約・出典管理
- charts/ … 図表レンダリング（Chart.js）
- validate/ … 整合性/様式チェック

---
本ドキュメントに沿って実装を進めれば、既存機能に悪影響を与えずに、持続化補助金向けのAI自動生成MVPへ拡張可能です。

### 10. renewplan.md の取り込み方（設計）

目的: 事業者や編集者が用意した指示書 `renewplan.md` を草案生成のガイダンスとして活用する。

採用案（実装方針のみ。現状コードの変更は無し）
1) リポジトリ参照モード（開発者向け）
   - ルート直下に `renewplan.md` が存在する場合、DraftService は起動時に読み取り、草案生成時に `guidance_text` としてマージする。
   - 優先度: APIで与えられる `guidance_text` > `renewplan.md` > なし。

2) アップロード参照モード（本番向け）
   - `POST /intake/upload` で `renewplan.md` をアップロード（type=other）。
   - 返却された `file_id` を `POST /draft` の `guidance_file_id` に渡す（DraftService が内容を読み込み統合）。

OpenAPIの拡張（次のPRで他AIが実施）
- DraftRequest に以下の任意フィールドを追加:
  - `guidance_text: string`（直接テキストを与える場合）
  - `guidance_file_id: string`（アップロード済みファイルを参照）

renewplan.md の推奨構成（テンプレ）
```
# Renewal Plan for Jizokuka Grant
## Scope
- schemeId: jizokuka-2025-v1
- target persona, tone, do/don't

## Sections
- background: 〜の観点を必ず含める
- problem_solution: 〜の差別化観点
- plan_5w1h: 箇条書き必須、各3行以内
- kpi: {name, baseline, target, unit, by}
- roadmap: {milestone, start, end}
- budget: 補助対象経費区分マッピングルール
- team: 役割/RACI
- risks: 3〜5点、対策は能動表現

## Validation Rules (追加)
- 背景: 1500〜2000字、禁止語: 〜
- KPI: CVRなど最大5項目、数値範囲: 〜

## Data Sources / Charts
- sources: …
- charts: line: EC市場規模推移（年/兆円）
```

注意: 現在の実装はスタブのため、上記は「実装方針」。実動作には DraftService/ValidateService の拡張が必要。
