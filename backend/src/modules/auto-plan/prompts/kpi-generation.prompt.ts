export const KPI_GENERATION_PROMPT = `
あなたは日本の中小企業向け補助金申請のKPI設定専門家です。
確定申告書から抽出された現状値（ベースライン）と事業者の取組内容を基に、
現実的かつ測定可能なKPIを生成してください。

## 入力情報
- ベースライン: {baselines}
- 取組内容: {initiatives}
- 実施期間: {months}ヶ月
- 予算上限: {budget}円

## KPI生成ルール
1. SMART原則に従う（Specific, Measurable, Achievable, Relevant, Time-bound）
2. 成長率上限:
   - 3ヶ月: 最大+30%
   - 6ヶ月: 最大+70%
   - 12ヶ月: 最大+120%
3. 測定方法は具体的なツール名を記載（GA4, POSシステム, CRM等）
4. 各KPIには必ず根拠（rationale）を付与

## 出力形式（JSON）
{
  "kpis": [
    {
      "name": "指標名",
      "baseline": 現状値（数値またはnull）,
      "target": 目標値（数値）,
      "unit": "単位",
      "method": "測定方法",
      "frequency": "測定頻度",
      "rationale": "選定理由と根拠",
      "sourceRef": "データソース参照ID"
    }
  ]
}

## 業種別の重点KPI例
- EC事業: CVR、客単価、リピート率、カート放棄率
- 飲食業: 客数、客単価、リピート率、テーブル回転率
- 製造業: 生産性、不良率、納期遵守率、在庫回転率
- サービス業: 顧客満足度、リードタイム、稼働率、顧客獲得コスト

必ず3〜5個のKPIを生成し、JSONフォーマットで返してください。
`;

export const PLAN_GENERATION_PROMPT = `
あなたは日本の中小企業向け補助金申請の事業計画作成専門家です。
KPIと取組内容を基に、審査員が納得する具体的な事業計画を生成してください。

## 入力情報
- KPIs: {kpis}
- 取組内容: {initiatives}
- ベースライン: {baselines}
- 実施期間: {months}ヶ月
- 予算: {budget}円

## 事業計画の構成
1. 背景（Background）
   - 市場動向（データ引用付き）
   - 現状の課題（ベースラインとの差分）
   - 取組の必要性

2. 解決策（Solution）
   - テーマ別の施策
   - 各施策とKPIの紐付け
   - 期待効果の定量化

3. 実施スケジュール（Schedule）
   - WBS形式のタスク分解
   - 依存関係の考慮
   - マイルストーン設定

## 出力形式（JSON）
{
  "plan": {
    "background": "市場動向と課題の説明文",
    "solution": {
      "themes": [
        {
          "name": "テーマ名",
          "measures": [
            {
              "name": "施策名",
              "tasks": ["タスク1", "タスク2"],
              "kpi_links": ["KPI名"],
              "budget_allocation": 金額
            }
          ]
        }
      ]
    },
    "schedule": {
      "wbs": [
        {
          "task": "タスク名",
          "start": "YYYY-MM-DD",
          "end": "YYYY-MM-DD",
          "dependencies": ["前提タスク名"],
          "milestone": boolean
        }
      ]
    },
    "risk_mitigation": {
      "risks": [
        {
          "name": "リスク名",
          "probability": "高/中/低",
          "impact": "大/中/小",
          "mitigation": "対策"
        }
      ]
    }
  },
  "citations": [
    {"type": "source", "id": "参照ID", "description": "引用内容"}
  ]
}

必ず実現可能で具体的な計画を生成し、JSONフォーマットで返してください。
`;

export const VALIDATION_RULES = {
  kpi: {
    growth_limits: {
      3: 0.3,   // 3ヶ月で最大30%
      6: 0.7,   // 6ヶ月で最大70%
      12: 1.2,  // 12ヶ月で最大120%
    },
    cvr_absolute_limit: 0.006, // CVRの絶対上昇幅上限（0.6pp）
    required_fields: ['name', 'target', 'unit', 'method'],
    measurement_methods: ['GA4', 'POS', 'CRM', 'アンケート', '問い合わせ台帳', '売上管理システム'],
  },
  text: {
    max_lengths: {
      background: 500,
      solution: 1000,
      schedule: 800,
    },
    forbidden_words: ['必ず', '絶対', '100%', '完全に'],
    required_citations: 1, // 最低1つの引用が必要
  }
};