export const PROMPT_TEMPLATES = {
  // 課題分析プロンプト
  ANALYZE_ISSUES: `
あなたは補助金申請のコンサルタントです。
以下の事業内容と困りごとから、補助金申請に適した課題分析を行ってください。

事業内容:
{businessDescription}

困りごと:
{painPoints}

以下の形式で分析結果を出力してください：
1. 現状課題（3つ以上）
   - カテゴリ（売上・効率・品質・人材・マーケティング・技術・その他から選択）
   - 具体的な課題内容
   - ビジネスへの影響

2. 根本原因分析
   - なぜその課題が発生しているか

3. 推奨される解決策
   - 具体的な施策
   - 期待される効果
`,

  // 解決策提案プロンプト
  SUGGEST_SOLUTIONS: `
あなたは補助金申請の専門家です。
以下の課題に対して、補助金を活用した解決策を提案してください。

現状課題:
{currentIssues}

業種:
{businessType}

制約条件:
- 補助金上限: {maxAmount}円
- 実施期間: {implementationPeriod}

以下の観点で解決策を提案してください：
1. 具体的な解決策（3つ）
2. 各解決策のアプローチ方法
3. 独自性・差別化ポイント
4. 実現可能性の評価
`,

  // 5W1H詳細化プロンプト
  ELABORATE_PLAN: `
あなたは事業計画の専門家です。
以下の施策を5W1H形式で具体化してください。

施策概要:
{planSummary}

解決したい課題:
{targetIssue}

以下の形式で詳細化してください：
- What（何を）: 具体的な実施内容
- Why（なぜ）: 実施の必要性と根拠
- Who（誰が）: 実施体制と責任者
- Where（どこで）: 実施場所・対象範囲
- When（いつまでに）: スケジュールとマイルストーン
- How（どのように）: 具体的な実施方法とプロセス

期待される成果も含めて記載してください。
`,

  // KPI提案プロンプト
  SUGGEST_KPIS: `
あなたはKPI設定の専門家です。
以下の事業計画に対して、適切なKPIを提案してください。

事業計画:
{businessPlan}

期待される効果:
{expectedEffects}

以下の観点でKPIを提案してください（5つ以上）：
1. 指標名とカテゴリ（売上/客数/単価/CV率/効率性/品質）
2. 現在値（推定値）
3. 1年目、2年目、3年目の目標値
4. 計算式・測定方法
5. なぜこのKPIが重要か

SMARTの原則（Specific, Measurable, Achievable, Relevant, Time-bound）に従って設定してください。
`,

  // リスク分析プロンプト
  ANALYZE_RISKS: `
あなたはリスク管理の専門家です。
以下の事業計画のリスクを分析してください。

事業計画:
{businessPlan}

実施内容:
{implementationDetails}

以下のカテゴリでリスクを分析してください：
1. 技術リスク
2. 市場リスク
3. 財務リスク
4. 運用リスク
5. 法的リスク

各リスクについて：
- 発生確率（1-5）
- 影響度（1-5）
- 予防策
- 対応策（発生時）
- リスクオーナー

を提示してください。
`,

  // 市場分析プロンプト
  ANALYZE_MARKET: `
あなたは市場分析の専門家です。
以下の事業について市場分析を行ってください。

事業内容:
{businessDescription}

ターゲット:
{targetCustomer}

地域:
{region}

以下の観点で分析してください：
1. 市場規模と成長性
2. 競合状況と自社のポジション
3. 顧客ニーズとトレンド
4. 参入障壁と成功要因
5. 3年後の市場予測

具体的な数値やデータを含めて分析してください。
`,

  // ガントチャート生成プロンプト
  GENERATE_GANTT: `
あなたはプロジェクト管理の専門家です。
以下の事業計画に対して、実施スケジュールを作成してください。

事業計画:
{businessPlan}

実施期間:
{implementationPeriod}

主要な取組:
{mainActivities}

以下の形式でタスクを設定してください：
1. フェーズ分け（準備・実施・評価）
2. 各フェーズの主要タスク
3. タスク間の依存関係
4. 各タスクの期間と担当者
5. 重要なマイルストーン

クリティカルパスを明確にし、リスクバッファも考慮してください。
`,

  // 申請書サマリー生成
  GENERATE_SUMMARY: `
あなたは補助金申請書作成の専門家です。
以下の情報から、説得力のある申請書サマリーを作成してください。

事業者情報:
{companyInfo}

現状課題:
{currentIssues}

解決策:
{solutions}

期待される効果:
{expectedEffects}

必要な補助金額:
{requestedAmount}円

200文字以内で、以下の要素を含めて要約してください：
1. 解決すべき課題の重要性
2. 提案する解決策の独自性
3. 期待される社会的・経済的効果
4. 補助金の必要性

審査員の心に響く、簡潔で力強い文章にしてください。
`,
};

// プロンプトのカテゴリ
export enum PromptCategory {
  ANALYSIS = 'analysis',
  SUGGESTION = 'suggestion',
  ELABORATION = 'elaboration',
  RISK = 'risk',
  MARKET = 'market',
  PLANNING = 'planning',
  SUMMARY = 'summary',
}

// プロンプトのメタデータ
export interface PromptMetadata {
  category: PromptCategory;
  name: string;
  description: string;
  requiredVariables: string[];
  outputFormat: 'json' | 'text' | 'markdown';
}