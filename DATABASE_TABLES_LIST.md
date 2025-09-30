# 補助金申請アプリケーション データベーステーブル一覧

## 概要
本アプリケーションで必要なすべてのテーブルを以下に列挙します。
これらのテーブルはPrisma ORMを使用してPostgreSQL（Supabase）に作成されます。

## コアテーブル（基本機能）

### 1. **users** - ユーザー管理
- 認証・認可のための基本ユーザー情報
- カラム: id, email, role (ADMIN/EDITOR/VIEWER), createdAt, updatedAt
- 関連: applications, costTrackings, auditLogs

### 2. **applicants** - 申請者情報
- 企業・代表者の基本情報（個人情報含む、12ヶ月保持）
- カラム: id, companyName, representativeName, phoneNumber, email, address, establishedYear, employeeCount, capital, businessDescription, createdAt, updatedAt, deletedAt
- 関連: applications, bankAccounts

### 3. **bank_accounts** - 銀行口座情報
- 振込先口座情報（個人情報、口座番号は下4桁のみ表示）
- カラム: id, applicantId, bankName, branchName, accountType, accountNumber, accountHolder, createdAt, updatedAt, deletedAt
- 関連: applicant

### 4. **applications** - 申請データ
- 申請書のメインテーブル
- カラム: id, userId, applicantId, title, status, locale, baselines, submittedAt, createdAt, updatedAt, deletedAt
- 関連: すべての申請関連テーブル

### 5. **budgets** - 予算情報
- 補助金申請の予算計画
- カラム: id, applicationId, totalAmount, subsidyRate, subsidyAmount, targetExpenses, createdAt, updatedAt
- 関連: application

### 6. **kpis** - KPI指標
- 成果指標の定義と目標値
- カラム: id, applicationId, name, unit, baselineValue, targetValue, achievementDate, rationale, measurementMethod, createdAt, updatedAt
- 関連: application

### 7. **plans** - 計画概要
- プロジェクト計画の基本情報
- カラム: id, applicationId, background, solution, expectedOutcome, summary, createdAt, updatedAt
- 関連: application, actions, schedules, organization, risks

### 8. **actions** - アクション（5W1H）
- 具体的な実行計画
- カラム: id, planId, name, purpose, deliverable, evidence, assignee, location, scheduledAt, method, status, createdAt, updatedAt
- 関連: plan

### 9. **schedules** - スケジュール
- ガントチャート用のタスクスケジュール
- カラム: id, planId, taskName, startDate, endDate, duration, dependencies, assignee, progress, createdAt, updatedAt
- 関連: plan

### 10. **organizations** - 組織体制
- 実施体制の組織構造
- カラム: id, planId, structure, createdAt, updatedAt
- 関連: plan, teamMembers

### 11. **team_members** - チームメンバー
- 組織内のメンバー情報
- カラム: id, organizationId, name, role, workloadPercent, responsibilities, createdAt, updatedAt
- 関連: organization

### 12. **risks** - リスク管理
- プロジェクトリスクの評価と対策
- カラム: id, planId, content, probability, impact, mitigation, owner, status, createdAt, updatedAt
- 関連: plan

### 13. **evidences** - エビデンス/証拠書類
- アップロードされた証拠書類の管理（OCR処理含む）
- カラム: id, applicationId, type, source, status, originalFilename, mimeType, size, checksum, fileUrl, sourceUrl, content, metadata, securityScan, processingTime, qualityScore, title, description, fileType, footnotes, createdAt, processedAt, updatedAt, deletedAt
- 関連: application, citations

### 14. **competitors** - 競合分析
- 競合他社の分析データ
- カラム: id, applicationId, name, description, strengths, weaknesses, marketShare, analysisData, createdAt, updatedAt
- 関連: application

## Phase 1 拡張テーブル（高度な申請機能）

### 15. **purpose_backgrounds** - 目的・背景
- 課題分析と解決策の詳細
- カラム: id, applicationId, currentIssues, painPoints, rootCause, solution, approach, uniqueValue, logicTree, createdAt, updatedAt
- 関連: application

### 16. **detailed_plans** - 詳細計画（5W1H拡張版）
- より詳細な実行計画
- カラム: id, applicationId, what, why, who, where, when, how, priority, category, expectedResult, prerequisite, relatedTaskIds, orderIndex, createdAt, updatedAt
- 関連: application

### 17. **kpi_targets** - KPI目標値
- 複数年度のKPI目標設定
- カラム: id, applicationId, category, metric, unit, currentValue, year1Target, year2Target, year3Target, formula, assumptions, chartType, displayOrder, createdAt, updatedAt
- 関連: application

### 18. **gantt_tasks** - ガントチャートタスク
- 詳細なプロジェクトタスク管理
- カラム: id, applicationId, taskName, description, taskType, startDate, endDate, duration, progress, dependencies, parentTaskId, assignee, assigneeRole, resources, color, milestone, critical, orderIndex, createdAt, updatedAt
- 関連: application

### 19. **organization_structures** - 組織構造詳細
- 組織体制図とRACIマトリックス
- カラム: id, applicationId, chartData, chartType, raciMatrix, externalPartners, advisors, createdAt, updatedAt
- 関連: application, organizationRoles

### 20. **organization_roles** - 組織内役割
- 詳細な役割定義と責任範囲
- カラム: id, structureId, name, title, department, level, reportsTo, responsibilities, authorities, kpis, allocation, startDate, endDate, createdAt, updatedAt
- 関連: organizationStructure

### 21. **risk_assessments** - リスク評価詳細
- 詳細なリスク分析と対策計画
- カラム: id, applicationId, category, title, description, probability, impact, riskScore, preventiveMeasures, contingencyPlan, triggerPoints, owner, reviewer, status, reviewDate, affectedAreas, dependencies, createdAt, updatedAt
- 関連: application

### 22. **supplementary_materials** - 補足資料
- 市場分析、競合分析、Before/Afterなどの補足資料
- カラム: id, applicationId, materialType, title, description, content, visualData, marketSize, growthRate, targetSegment, competitiveData, positioning, beforeState, afterState, improvements, source, validUntil, confidence, orderIndex, createdAt, updatedAt
- 関連: application

## Phase 2 統合テーブル（フロントエンド/バックエンド連携）

### 23. **generation_results** - AI生成結果
- AIによる自動生成コンテンツの管理
- カラム: id, applicationId, type, content, prompt, model, tokensUsed, cost, metadata, createdAt, updatedAt
- 関連: application, citations

### 24. **citations** - 引用管理
- 生成コンテンツの引用元管理
- カラム: id, generationId, evidenceId, citationNumber, citedText, url, title, confidence, pageNumber, createdAt
- 関連: generationResult, evidence

### 25. **jobs** - 非同期ジョブ管理
- バックグラウンド処理の管理（OCR、生成、検証など）
- カラム: id, applicationId, type, status, progress, message, startedAt, completedAt, error, retryCount, maxRetries, payload, result, metadata, idempotencyKey, createdAt, updatedAt
- 関連: application

### 26. **validation_results** - 検証結果
- フィールド検証、ビジネスルール検証の結果
- カラム: id, applicationId, type, passed, score, errors, warnings, metadata, createdAt
- 関連: application

### 27. **preflight_results** - プリフライトチェック結果
- PDF生成前のドキュメント検証結果
- カラム: id, applicationId, documentId, passed, pageCount, hasEmbeddedFonts, hasMargins, hasStampSpace, fontSize, resolution, colorSpace, pdfVersion, errors, warnings, metadata, createdAt
- 関連: application

### 28. **cost_trackings** - コスト追跡
- API利用コストの追跡（OpenAI、OCR、ストレージなど）
- カラム: id, applicationId, userId, service, operation, units, unitCost, totalCost, currency, metadata, createdAt
- 関連: application, user

### 29. **export_histories** - エクスポート履歴
- ドキュメントエクスポートの履歴管理
- カラム: id, applicationId, format, fileUrl, downloadUrl, size, metadata, downloadCount, expiresAt, createdAt
- 関連: application

### 30. **audit_logs** - 監査ログ
- システム操作の監査証跡
- カラム: id, applicationId, userId, actor, action, resource, resourceId, details, ipAddress, userAgent, createdAt
- 関連: application, user

## システム管理テーブル

### 31. **feature_flags** - 機能フラグ
- 機能の有効/無効を制御
- カラム: id, key, enabled, description, metadata, createdAt, updatedAt
- 関連: なし（システム全体）

### 32. **templates** - テンプレート管理
- ドキュメント生成用テンプレート
- カラム: id, name, type, version, content, fileUrl, sha256, mappings, metadata, isActive, createdAt, updatedAt
- 関連: なし（システム全体）

### 33. **subsidy_rules** - 補助金ルール
- 補助金制度のルール定義
- カラム: id, category, name, version, conditions, subsidyRate, maxAmount, targetExpenses, exclusions, isActive, validFrom, validUntil, createdAt, updatedAt
- 関連: なし（システム全体）

## テーブル総数: 33テーブル

## 重要な注意事項

### 個人情報の扱い
- applicants, bank_accounts, applications(locale)は個人情報を含む
- 12ヶ月のデータ保持期限を設定
- 口座番号は下4桁のみ表示
- ソフトデリート（deletedAt）を使用

### インデックス
- 各テーブルに適切なインデックスを設定
- 検索頻度の高いカラムにインデックス追加
- 複合インデックスでパフォーマンス最適化

### リレーション
- Prismaの関係性定義により整合性を保証
- カスケード削除は慎重に設定
- 循環参照を避ける設計

### セキュリティ
- 個人情報のマスキング
- AES256暗号化（必要に応じて）
- 監査ログによる操作追跡
- Row Level Security (RLS)の適用検討