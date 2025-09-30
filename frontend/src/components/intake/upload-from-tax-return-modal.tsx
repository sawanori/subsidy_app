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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileDropZone } from './file-drop-zone';
import { apiClient } from '@/lib/api/client';
import { IntakeResponse, ExtractResponse } from '@/lib/api/types';
import { FileText, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface UploadFromTaxReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractComplete: (data: ExtractResponse) => void;
  applicationId?: string;
}

type TaxReturnType = 'personal' | 'corporate';

export function UploadFromTaxReturnModal({
  isOpen,
  onClose,
  onExtractComplete,
  applicationId,
}: UploadFromTaxReturnModalProps) {
  const [step, setStep] = useState<'select' | 'upload' | 'processing' | 'complete'>('select');
  const [taxReturnType, setTaxReturnType] = useState<TaxReturnType>('personal');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<IntakeResponse | null>(null);
  const [extractResponse, setExtractResponse] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        { type: 'tax_return' }
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
      console.error('[Upload Error]', err);
      const errorMsg = err.message || err.toString() || '処理中にエラーが発生しました';
      const detailMsg = err.details ? JSON.stringify(err.details) : '';
      setError(`${errorMsg}${detailMsg ? `\n詳細: ${detailMsg}` : ''}`);
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setTaxReturnType('personal');
    setUploadedFile(null);
    setUploadResponse(null);
    setExtractResponse(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  const handleNext = () => {
    if (step === 'select') {
      setStep('upload');
    } else if (step === 'upload' && uploadedFile) {
      handleUpload(uploadedFile);
    }
  };

  const canProceed = () => {
    if (step === 'select') return true;
    if (step === 'upload') return uploadedFile !== null;
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              確定申告書からデータを取り込む
            </div>
          </DialogTitle>
          <DialogDescription>
            確定申告書をアップロードして、申請者情報を自動で抽出します
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* ステップ1: 種別選択 */}
          {step === 'select' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">確定申告書の種別を選択</Label>
                <RadioGroup
                  value={taxReturnType}
                  onValueChange={(value) => setTaxReturnType(value as TaxReturnType)}
                >
                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50">
                    <RadioGroupItem value="personal" id="personal" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="personal" className="cursor-pointer">
                        <div className="font-medium">個人事業主</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          所得税の確定申告書（青色申告・白色申告）
                        </div>
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50">
                    <RadioGroupItem value="corporate" id="corporate" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="corporate" className="cursor-pointer">
                        <div className="font-medium">法人</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          法人税の確定申告書（別表含む）
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  確定申告書から以下の情報を自動抽出します：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>氏名・法人名</li>
                    <li>住所・所在地</li>
                    <li>屋号（個人事業主の場合）</li>
                    <li>所得金額・売上高</li>
                    <li>事業年度</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* ステップ2: アップロード */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">
                  {taxReturnType === 'personal' ? '個人' : '法人'}の確定申告書をアップロード
                </Label>
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
                  PDFまたは画像形式の確定申告書をアップロードしてください。
                  複数ページの場合は、すべてのページを含むPDFファイルを推奨します。
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* ステップ3: 処理中 */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">処理中...</p>
              <p className="text-sm text-muted-foreground text-center">
                確定申告書を解析してデータを抽出しています
              </p>
            </div>
          )}

          {/* ステップ4: 完了 */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle className="h-12 w-12 text-status-success" />
              <p className="text-lg font-medium">抽出完了</p>
              <p className="text-sm text-muted-foreground text-center">
                確定申告書からデータの抽出が完了しました
              </p>
              {extractResponse && (
                <div className="text-sm text-muted-foreground">
                  <p>文書タイプ: {extractResponse.document_type}</p>
                  <p>抽出フィールド数: {Object.keys(extractResponse.extracted_fields).length}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {step === 'complete' ? '閉じる' : 'キャンセル'}
          </Button>
          {step !== 'processing' && step !== 'complete' && (
            <Button onClick={handleNext} disabled={!canProceed() || isProcessing}>
              {step === 'select' ? '次へ' : 'アップロード'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
