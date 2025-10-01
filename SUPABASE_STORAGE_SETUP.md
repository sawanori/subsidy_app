# Supabase Storage セットアップガイド

## 📦 作成済みバケット

以下の3つのストレージバケットが作成されました：

### 1. evidence-files
- **用途**: エビデンスファイル（PDF、画像、Excel等）の保存
- **容量制限**: 50MB/ファイル
- **対応形式**:
  - PDF (`application/pdf`)
  - JPEG/PNG (`image/jpeg`, `image/png`)
  - Excel (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
  - CSV (`text/csv`)
- **アクセス**: Private（認証必須）

### 2. generated-documents
- **用途**: 生成されたドキュメント（PDF、DOCX、ZIP）の保存
- **容量制限**: 100MB/ファイル
- **対応形式**:
  - PDF (`application/pdf`)
  - DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
  - ZIP (`application/zip`)
- **アクセス**: Private（認証必須）

### 3. temp-files
- **用途**: OCR処理中の一時ファイル保存
- **容量制限**: 50MB/ファイル
- **対応形式**: PDF、JPEG、PNG
- **アクセス**: Private（認証必須）

---

## 🔐 RLS ポリシー設定（要手動設定）

Supabase Dashboard でRLSポリシーを設定してください：

### 手順

1. [Supabase Dashboard](https://supabase.com/dashboard/project/wcxjtqzekllzjpxbbicj/storage/policies) にアクセス
2. 「Storage」→「Policies」タブを開く
3. 以下のポリシーを作成

### evidence-files バケット

#### ポリシー 1: Upload evidence files
```sql
-- Policy name: Users can upload evidence files
-- Allowed operations: INSERT
-- Target roles: authenticated

CREATE POLICY "Users can upload evidence files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### ポリシー 2: View evidence files
```sql
-- Policy name: Users can view their evidence files
-- Allowed operations: SELECT
-- Target roles: authenticated

CREATE POLICY "Users can view their evidence files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### ポリシー 3: Update evidence files
```sql
-- Policy name: Users can update their evidence files
-- Allowed operations: UPDATE
-- Target roles: authenticated

CREATE POLICY "Users can update their evidence files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidence-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### ポリシー 4: Delete evidence files
```sql
-- Policy name: Users can delete their evidence files
-- Allowed operations: DELETE
-- Target roles: authenticated

CREATE POLICY "Users can delete their evidence files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### generated-documents バケット

#### ポリシー 5: Create generated documents
```sql
-- Policy name: Service can create generated documents
-- Allowed operations: INSERT
-- Target roles: authenticated

CREATE POLICY "Service can create generated documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-documents');
```

#### ポリシー 6: View generated documents
```sql
-- Policy name: Users can view generated documents
-- Allowed operations: SELECT
-- Target roles: authenticated

CREATE POLICY "Users can view generated documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### ポリシー 7: Delete generated documents
```sql
-- Policy name: Users can delete generated documents
-- Allowed operations: DELETE
-- Target roles: authenticated

CREATE POLICY "Users can delete generated documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### temp-files バケット

#### ポリシー 8: Manage temp files
```sql
-- Policy name: Users can manage temp files
-- Allowed operations: ALL
-- Target roles: authenticated

CREATE POLICY "Users can manage temp files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'temp-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 📁 ファイルパス構造

ユーザーIDごとにフォルダを分けて管理：

```
evidence-files/
  {user_id}/
    {application_id}/
      evidence1.pdf
      evidence2.jpg
      evidence3.xlsx

generated-documents/
  {user_id}/
    {application_id}/
      final_document.pdf
      attachments.zip

temp-files/
  {user_id}/
    {job_id}/
      ocr_processing.pdf
      temp_image.jpg
```

---

## 🔌 バックエンド統合

### 環境変数

`.env` に以下を追加（既に設定済み）：

```bash
SUPABASE_URL=https://wcxjtqzekllzjpxbbicj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=your_service_role_key
```

### ストレージサービスの使用例

```typescript
import { SupabaseService } from '@/supabase/supabase.service';

// ファイルアップロード
async uploadEvidence(userId: string, applicationId: string, file: Express.Multer.File) {
  const filePath = `${userId}/${applicationId}/${file.originalname}`;

  const { data, error } = await this.supabaseService.client
    .storage
    .from('evidence-files')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false, // 同名ファイルの上書きを防ぐ
    });

  if (error) throw error;
  return data;
}

// ファイル取得
async getEvidence(userId: string, applicationId: string, fileName: string) {
  const filePath = `${userId}/${applicationId}/${fileName}`;

  const { data, error } = await this.supabaseService.client
    .storage
    .from('evidence-files')
    .download(filePath);

  if (error) throw error;
  return data;
}

// 署名付きURL生成（一時的なダウンロードURL）
async getSignedUrl(userId: string, applicationId: string, fileName: string) {
  const filePath = `${userId}/${applicationId}/${fileName}`;

  const { data, error } = await this.supabaseService.client
    .storage
    .from('evidence-files')
    .createSignedUrl(filePath, 3600); // 1時間有効

  if (error) throw error;
  return data.signedUrl;
}

// ファイル削除
async deleteEvidence(userId: string, applicationId: string, fileName: string) {
  const filePath = `${userId}/${applicationId}/${fileName}`;

  const { error } = await this.supabaseService.client
    .storage
    .from('evidence-files')
    .remove([filePath]);

  if (error) throw error;
}
```

---

## 🧹 一時ファイルのクリーンアップ

定期的に古い一時ファイルを削除するジョブを設定：

```typescript
// 24時間以上経過した一時ファイルを削除
async cleanupTempFiles() {
  const { data: files } = await this.supabaseService.client
    .storage
    .from('temp-files')
    .list();

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const oldFiles = files.filter(file =>
    new Date(file.created_at) < oneDayAgo
  );

  if (oldFiles.length > 0) {
    await this.supabaseService.client
      .storage
      .from('temp-files')
      .remove(oldFiles.map(f => f.name));
  }
}
```

---

## 📊 ストレージ使用量の確認

Supabase Dashboard で確認：
1. 「Settings」→「Usage」タブ
2. Storage使用量を確認
3. Free tier: 1GB まで無料
4. Pro tier: 100GB まで ($0.021/GB/月)

---

## ⚠️ セキュリティ注意事項

1. **ファイルバリデーション**: アップロード前にMIMEタイプと拡張子を検証
2. **ウイルススキャン**: ClamAVでスキャン後にSupabaseにアップロード
3. **ファイルサイズ制限**: バケット設定で制限済み
4. **ユーザー分離**: RLSポリシーでユーザーごとにアクセス制御
5. **署名付きURL**: 公開URLではなく署名付きURLを使用

---

## 🔄 次のステップ

1. ✅ バケット作成完了
2. ⏳ RLSポリシーの手動設定（Dashboard から）
3. ⏳ バックエンドのStorageサービス実装
4. ⏳ フロントエンドのファイルアップロード機能統合
