'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileDropZone } from './file-drop-zone';
import { apiClient } from '@/lib/api/client';
import { IntakeResponse, ExtractResponse } from '@/lib/api/types';
import { Building, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface UploadFromTeihonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractComplete: (data: ExtractResponse) => void;
  applicationId?: string;
}

export function UploadFromTeihonModal({
  isOpen,
  onClose,
  onExtractComplete,
  applicationId,
}: UploadFromTeihonModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<IntakeResponse | null>(null);
  const [extractResponse, setExtractResponse] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'processing' | 'complete'>('upload');

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setError(null);
  };

  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      // ファイルアップロード
      const uploadRes = await apiClient.uploadFile<IntakeResponse>(
        '/intake/upload',
        file,
        { type: 'certificate' }
      );
      setUploadResponse(uploadRes);

      // OCR処理とデータ抽出
      const extractRes = await apiClient.post<ExtractResponse>('/intake/extract', {
        file_id: uploadRes.file_id,
        ocr_provider: 'tesseract',
      });
      setExtractResponse(extractRes);

      // 成功
      setStep('complete');

      // 2秒後に結果を返す
      setTimeout(() => {
        onExtractComplete(extractRes);
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || '処理中にエラーが発生しました');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setUploadedFile(null);
    setUploadResponse(null);
    setExtractResponse(null);
    setError(null);
    setIsProcessing(false);
    setStep('upload');
    onClose();
  };

  const handleSubmit = () => {
    if (uploadedFile) {
      handleUpload(uploadedFile);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              商業登記簿謄本からデータを取り込む
            </div>
          </DialogTitle>
          <DialogDescription>
            商業登記簿謄本（履歴事項全部証明書）をアップロードして、法人情報を自動で抽出します
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* アップロード画面 */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div>
                <FileDropZone
                  onFileSelect={handleFileSelect}
                  accept={{
                    'application/pdf': ['.pdf'],
                    'image/*': ['.png', '.jpg', '.jpeg'],
                  }}
                  maxSize={20 * 1024 * 1024} // 20MB
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">以下の情報を自動抽出します：</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>商号（会社名）</li>
                      <li>本店所在地</li>
                      <li>代表者名</li>
                      <li>会社成立の年月日</li>
                      <li>資本金の額</li>
                      <li>目的（事業内容）</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className="border-japanese-navy/20 bg-japanese-navy/5">
                <Info className="h-4 w-4 text-japanese-navy" />
                <AlertDescription className="text-sm">
                  <strong>対応書類：</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>履歴事項全部証明書</li>
                    <li>現在事項全部証明書</li>
                    <li>商業登記簿謄本</li>
                  </ul>
                  法務局で発行された3ヶ月以内の書類を推奨します。
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* 処理中 */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">処理中...</p>
              <p className="text-sm text-muted-foreground text-center">
                謄本を解析して法人情報を抽出しています
              </p>
              <div className="text-xs text-muted-foreground space-y-1 text-center">
                <p>文字認識処理中...</p>
                <p>フィールド識別中...</p>
                <p>データ正規化中...</p>
              </div>
            </div>
          )}

          {/* 完了 */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle className="h-12 w-12 text-status-success" />
              <p className="text-lg font-medium">抽出完了</p>
              <p className="text-sm text-muted-foreground text-center">
                商業登記簿謄本から法人情報の抽出が完了しました
              </p>
              {extractResponse && (
                <div className="bg-muted/30 rounded-lg p-4 w-full max-w-md">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">文書タイプ:</span>
                      <span className="font-medium">
                        {extractResponse.document_type === 'certificate' ? '登記簿謄本' : '不明'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">抽出項目数:</span>
                      <span className="font-medium">
                        {Object.keys(extractResponse.extracted_fields).length}項目
                      </span>
                    </div>
                    {extractResponse.extracted_fields.companyName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">会社名:</span>
                        <span className="font-medium">
                          {extractResponse.extracted_fields.companyName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {step === 'complete' ? '閉じる' : 'キャンセル'}
          </Button>
          {step === 'upload' && (
            <Button
              onClick={handleSubmit}
              disabled={!uploadedFile || isProcessing}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              アップロードして抽出
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
