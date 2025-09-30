# Supabase データベースセットアップガイド

## 重要な設定手順

### 1. データベースパスワードの取得

Supabaseプロジェクトのデータベースパスワードを取得して設定する必要があります。

1. [Supabase Dashboard](https://supabase.com/dashboard/project/wcxjtqzekllzjpxbbicj) にアクセス
2. 左メニューから「Settings」→「Database」を選択
3. 「Connection string」セクションでパスワードを確認
   - または「Reset database password」でパスワードをリセット

### 2. 環境変数の設定

`backend/.env`ファイルの以下の部分を更新：

```bash
# [YOUR_DATABASE_PASSWORD]を実際のパスワードに置き換え
DATABASE_URL="postgresql://postgres.wcxjtqzekllzjpxbbicj:[YOUR_DATABASE_PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.wcxjtqzekllzjpxbbicj:[YOUR_DATABASE_PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Service Role Key（必要に応じて）
SUPABASE_SERVICE_KEY="[YOUR_SERVICE_ROLE_KEY]"
```

### 3. データベースマイグレーションの実行

パスワード設定後、以下のコマンドを実行：

```bash
cd backend/

# Prismaクライアントの生成
npx prisma generate

# 既存のマイグレーションをデータベースに適用
npx prisma migrate deploy

# または、開発環境で新規マイグレーションを作成
npx prisma migrate dev --name init
```

### 4. データベース接続の確認

```bash
# Prisma Studioでデータベースを確認
npx prisma studio

# またはPrismaでデータベース接続をテスト
npx prisma db pull
```

## プロジェクト情報

- **Project Name**: subsidy_app
- **Project ID**: wcxjtqzekllzjpxbbicj
- **Project URL**: https://wcxjtqzekllzjpxbbicj.supabase.co
- **Database Host**: db.wcxjtqzekllzjpxbbicj.supabase.co
- **Region**: ap-northeast-1 (東京)
- **PostgreSQL Version**: 17.6.1.005

## 作成されるテーブル（33テーブル）

詳細は [DATABASE_TABLES_LIST.md](./DATABASE_TABLES_LIST.md) を参照してください。

### コアテーブル
1. users - ユーザー管理
2. applicants - 申請者情報
3. bank_accounts - 銀行口座
4. applications - 申請データ
5. budgets - 予算情報
6. kpis - KPI指標
7. plans - 計画概要
8. actions - アクション
9. schedules - スケジュール
10. organizations - 組織体制
11. team_members - チームメンバー
12. risks - リスク管理
13. evidences - エビデンス
14. competitors - 競合分析

### Phase 1 拡張テーブル
15. purpose_backgrounds - 目的・背景
16. detailed_plans - 詳細計画
17. kpi_targets - KPI目標値
18. gantt_tasks - ガントチャート
19. organization_structures - 組織構造
20. organization_roles - 組織内役割
21. risk_assessments - リスク評価
22. supplementary_materials - 補足資料

### Phase 2 統合テーブル
23. generation_results - AI生成結果
24. citations - 引用管理
25. jobs - 非同期ジョブ
26. validation_results - 検証結果
27. preflight_results - プリフライト
28. cost_trackings - コスト追跡
29. export_histories - エクスポート履歴
30. audit_logs - 監査ログ

### システム管理テーブル
31. feature_flags - 機能フラグ
32. templates - テンプレート
33. subsidy_rules - 補助金ルール

## トラブルシューティング

### 接続エラーの場合

1. パスワードが正しく設定されているか確認
2. IPアドレス制限がある場合は、Supabaseダッシュボードで許可
3. Connection PoolingのURLを使用（pgbouncer=true）
4. SSL証明書の問題がある場合は`?sslmode=require`を追加

### マイグレーションエラーの場合

```bash
# マイグレーション履歴をリセット（開発環境のみ）
npx prisma migrate reset

# スキーマとデータベースの同期を確認
npx prisma db pull
npx prisma db push
```

## 次のステップ

1. **データベースパスワードの設定**を最優先で行ってください
2. マイグレーションを実行してテーブルを作成
3. `npm run start:dev`でバックエンドを起動
4. フロントエンドと連携してアプリケーションをテスト