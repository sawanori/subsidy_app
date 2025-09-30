# 補助金申請フロー刷新計画（AI全自動生成対応）

この文書は、ユーザーが「何をしたいか」を最小入力するだけで、事業計画・市場調査・KPI・計画・図表作図までをAIが自動生成し、様式・要件に整合する形で提出物を出力するための設計指針です。MVPで実装すべき機能、API仕様、検証観点を明確にし、他の生成AIがそのまま実装できる粒度で記述します。

## 1. 結論と方針

スコープ: 本サイトは「小規模事業者持続化補助金」に限定します（初期対応）。

- 現行フローは大筋OK。ただし「AI自動生成」を前倒しして、初期入力→一括草案生成→不足情報の対話埋めの順に再構成します。
- 審査で重視される「予算・体制・スケジュール・根拠（出典）」を、初回の自動草案に含める方針に統一します。
- 図表はサーバー側で自動作図（PNG/SVG）し、出典と注記を必須化。文章・数値と双方向整合チェックを行います。

## 2. 推奨フロー（MVP）

1) 対象制度・適格性チェック（選択/自動判定）
- 対象補助金（例：ものづくり、持続化、IT導入等）と要件の当て込みを先に行い、様式・語数などの制約を確定。
  - MVPでは「小規模事業者持続化補助金（jizokuka-2025-v1）」のみに対応。

2) ゴール入力（最小入力）
- 何をしたいか（1〜3文）／制約（予算上限、期限、人員）／対象市場・地域／既存の強み・資産。

3) AI自動草案作成（前倒し）
- 一括で「市場調査要約、課題と解決策、5W1H、KGI/KPI、ロードマップ、費用内訳、体制、リスク、差別化点」を生成。

4) 不足情報の追質問→再生成
- 生成物に不足する前提を自動抽出し、対話的にギャップを埋めて再生成（版管理）。

5) 事業計画の確定編集（様式準拠）
- 制度テンプレに自動流し込み。語数・段落・見出しを自動検証。

6) 証拠書類ガイド＆テンプレ生成
- 見積テンプレ、体制図、スケジュール（Gantt）、リスク管理表などの雛形を自動生成。

7) 整合性・要件チェック
- 要件マッチ、数値整合（合計、割合、KPI−ロードマップ整合）、禁止表現、出典有無を静的チェック。

8) 確認・送信
- PDF/Excel/様式ファイル出力。差分ログを付与し、改版履歴を保存。

## 3. 生成成果物の必須項目（初回草案に含める）

- 予算・費用内訳：補助対象経費区分、自己負担割合、キャッシュフロー。
- 体制・役割：社内/外部、責任者、ガバナンス、RACI簡易表。
- スケジュール：マイルストーン、クリティカルパス、依存関係、Gantt出力。
- リスクと対策：技術・市場・実行上・法令の観点で3〜5点、回避/軽減策。
- 競合・差別化：代替案、独自性、参入障壁、優位性の検証。
- 成果・波及効果：KGI/KPIに整合するアウトカムと測定方法。

## 4. システム構成（既存NestJS前提）

- フレームワーク：NestJS（既存 `nest-cli.json` を活用）
- DB：PostgreSQL + Prisma（既存）、ファイル保存は `uploads/`（MVP）
- LLM：プロバイダ抽象化（Env指定 `LLM_PROVIDER`, `LLM_API_KEY`）
- RAG：制度要件/様式のベクトル検索（MVPはローカルJSON + 近傍検索で可、拡張でpgvectorや外部ベクトルDB）
- 作図：`chartjs-node-canvas` または `echarts-node-canvas` でPNG/SVG生成
- PDF：`puppeteer` によるHTML→PDF、`handlebars` テンプレ
- 版管理：DBで`projects`, `drafts`, `revisions`, `artifacts`を分離

推奨モジュール構成（src配下）
- `modules/draft`：草案生成（LLM/RAGオーケストレーション）
- `modules/research`：外部データ要約/出典管理
- `modules/charts`：サーバー作図
- `modules/validate`：様式・要件・整合性チェック
- `modules/templates`：Handlebars/HTMLテンプレ管理
- `modules/files`：アップロード/成果物保存
- `modules/projects`：プロジェクト・版管理

## 5. API設計（MVP）

共通
- BasePath: `/api`
- 認証: MVPはトークン省略可（実運用はJWT）
- すべてJSON返却。バイナリは`contentType`と`filePath`/`base64`のどちらかを返却。

1) 草案生成
- `POST /api/draft`
Request
```json
{
  "schemeId": "jizokuka-2025-v1",
  "goal": "自社ECにAIレコメンドを導入してCVRを向上",
  "constraints": {"budgetMax": 8000000, "deadline": "2025-03-31", "staff": 3},
  "market": {"region": "全国", "industry": "EC/リテール"},
  "assets": ["顧客ID-POSデータ", "既存EC基盤"]
}
```
Response（サマリ）
```json
{
  "draftId": "drv_123",
  "sections": {
    "background": "…",
    "problemSolution": "…",
    "plan5w1h": {"what": "…", "why": "…", "how": "…", "who": "…", "when": "…", "where": "…"},
    "kpi": [{"name": "CVR", "baseline": 1.2, "target": 1.8, "unit": "%", "by": "2025-03-31"}],
    "roadmap": [{"milestone": "PoC", "start": "2024-11-01", "end": "2024-12-15"}],
    "budget": [{"category": "機械装置", "amount": 5000000}],
    "team": [{"role": "PM", "member": "山田"}],
    "risks": [{"risk": "学習データ不足", "mitigation": "外部データ連携"}],
    "differentiation": "…"
  },
  "references": [{"title": "EC白書2024", "source": "経産省", "url": "https://…"}]
}
```

2) 市場調査・出典
- `POST /api/research`
Request
```json
{
  "industry": "EC/リテール",
  "region": "全国",
  "keywords": ["EC 市場規模 2024", "AI レコメンド CVR"]
}
```
Response（要約＋データ）
```json
{
  "summary": "国内EC市場は前年比…",
  "sources": [
    {"title": "電子商取引に関する市場調査", "publisher": "経産省", "year": 2024, "url": "https://…", "notes": "BtoC市場規模…"}
  ],
  "datasets": [
    {"name": "ec_market_size", "unit": "兆円", "rows": [[2019, 19.4], [2020, 22.0], [2021, 24.0]]}
  ]
}
```

3) 図表生成
- `POST /api/charts`
Request
```json
{
  "spec": {"type": "line", "title": "EC市場規模推移", "xLabel": "年", "yLabel": "兆円"},
  "data": {"labels": [2019, 2020, 2021], "series": [{"name": "市場規模", "values": [19.4, 22.0, 24.0]}]},
  "format": "png",
  "width": 1200,
  "height": 800,
  "footer": "出典：経産省 電子商取引に関する市場調査(2024)"
}
```
Response
```json
{
  "contentType": "image/png",
  "base64": "iVBORw0KGgo…"
}
```

4) 様式・要件チェック
- `POST /api/validate`
Request
```json
{
  "schemeId": "monodukuri-2025-v1",
  "text": "…生成済み本文…",
  "numbers": {"budgetTotal": 8000000, "subsidyRate": 0.5},
  "structure": {"sections": ["背景", "課題", "解決策", "5W1H", "KPI", "計画", "予算", "体制", "リスク"]}
}
```
Response（例）
```json
{
  "ok": false,
  "errors": [
    {"code": "LEN_OVER", "message": "背景が規定の2000字を超過", "path": ["sections", 0]},
    {"code": "BUDGET_MISMATCH", "message": "費用内訳合計と総額が不一致"}
  ],
  "warnings": [
    {"code": "NO_SOURCE", "message": "市場規模の出典が未記載"}
  ],
  "stats": {"chars": 5200, "words": 2800}
}
```

5) 出力（任意/MVP+）
- `POST /api/export` → PDF, DOCX, XLSX の一括生成（zip）

補助API（任意）
- `POST /api/eligibility`（適格性チェック）
- `GET /api/templates`（テンプレ/様式一覧）

## 6. バリデーション仕様（抜粋）

- 語数・文字数：制度ごとの上限/下限、見出し必須。
- 数値整合：費用内訳合計＝総額、補助率上限、KPI目標が達成可能性レンジ内。
- スケジュール：開始・終了の前後関係、マイルストーンの依存整合、期間が制度期間内。
- 出典・注記：市場/統計値は出典必須、推定値は「推定」注記。
- 禁止/避ける表現：過度確定、無根拠断定、差別的表現、機微情報の露出。

## 7. 図表生成の規約

- 必須ラベル：タイトル、軸ラベル、単位、凡例、出典フッター。
- 解像度：A4想定で横1200px以上、印刷向け300dpi推奨（MVPは画面向けでも可）。
- カラー：印刷視認性優先（色覚多様性配慮：青/橙/緑系）。
- 形式：PNG（標準）、SVG（編集用）。

## 8. RAG/プロンプト方針

- ルール：制度要件・様式・配点表をRAGの主要コンテキストとして常時参照。
- 出典：文章内に脚注形式（[1]）でURL/発行元/年を付与。
- 数値：式または出典を返却ペイロードに同梱（再計算性）。
- プロンプト：システム→ルール、ユーザー→ゴール/制約、ツール→リサーチ/作図。段階実行で幻覚を低減。

## 9. MVPの受け入れ基準

- 1入力（ゴール/制約）で、本文（背景〜計画〜予算〜体制〜KPI）と最低1点の図表を自動生成できる。
- `POST /validate`で語数・数値整合・出典有無の自動判定が返る。
- `POST /charts`でPNG画像（ラベル/出典付き）が返る。
- PDFエクスポートで様式テンプレに自動流し込みできる（体裁8割以上）。
- 版管理：最終確定版と直前版の差分（変更セクションとKPI差分）が取得できる。

## 10. セキュリティ・運用

- PII/機微情報：入力のマスキング、保存の目的限定、削除API、監査ログ。
- モデルへの送信：必要最小限のフィールドのみを送信（サマリ化）。
- ログ：プロンプト/レスポンスのハッシュ化保存、完全本文は開発環境のみ。

## 11. データモデル（概略）

```
Project(id, title, schemeId, createdAt, updatedAt)
Draft(id, projectId, version, sections(jsonb), references(jsonb), createdAt)
Artifact(id, projectId, type[pdf|png|xlsx], path, meta(jsonb), createdAt)
ChartSpec(id, projectId, spec(jsonb), data(jsonb), imagePath, createdAt)
Template(id, schemeId, name, type[html|docx], path, version, createdAt)
```

## 12. 実装タスク（他AI向け指示）

- エンドポイント実装：`/draft`, `/research`, `/charts`, `/validate`, （任意）`/export`
- モジュール追加：`draft`, `research`, `charts`, `validate`, `templates`, `files`, `projects`
- 作図ユーティリティ：Chart.js or EChartsのNodeレンダリングの共通ラッパ
- テンプレ：HandlebarsでA4レイアウト（タイトル/目次/各章/脚注）
- RAG簡易実装：制度要件JSONをベクトル化せず、まずはキーワード一致＋スコアリング
- バリデータ：語数、数値整合、日付整合、禁止表現チェック
- 版管理：`Draft.version`のインクリメントと差分生成（deep-diff）

## 13. 決定事項（スコープ固定）

- 初期制度：小規模事業者持続化補助金（schemeId: jizokuka-2025-v1）
- 図表ライブラリ：Chart.js（サーバーレンダリング）
- 出力形式の優先度：PDFを最優先、ExcelはMVP+で対応
- データソース：まずは公開統計（e-Stat/各省庁）に限定（有料DBは将来検討）

## 14. 画面モード（UX指針）

- クイック：1画面でゴール入力→自動草案→バリデーション→出力
- 詳細：章ごとの編集/再生成、セクションロック、差分表示

---

この設計に沿ってAPI・モジュールを実装すれば、最小入力から全自動で事業計画と図表を生成し、様式・要件準拠で出力できるMVPが成立します。必要に応じて、OpenAPI定義への落とし込みやサンプルテンプレ（Handlebars/HTML）も提供可能です。
