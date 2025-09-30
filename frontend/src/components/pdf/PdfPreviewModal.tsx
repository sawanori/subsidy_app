'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Download, AlertCircle, Loader2 } from 'lucide-react';

/**
 * PdfPreviewModal - PDFプレビューモーダル
 *
 * Phase 5: PDF内容をモーダルでプレビュー
 */

interface PdfPreviewModalProps {
  draftId: string;
  trigger?: React.ReactNode;
  autoOpen?: boolean;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  draftId,
  trigger,
  autoOpen = false
}) => {
  const [open, setOpen] = useState(autoOpen);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !pdfUrl) {
      loadPdf();
    }
  }, [open]);

  const loadPdf = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pdf-generator/draft/${draftId}/preview`);

      if (!response.ok) {
        throw new Error('PDF生成に失敗しました');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `application_${draftId}.pdf`;
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            プレビュー
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>PDFプレビュー</DialogTitle>
          <DialogDescription>
            補助金申請書のプレビュー（Draft ID: {draftId}）
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* エラー表示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ローディング */}
          {loading && (
            <div className="space-y-4">
              <Skeleton className="w-full h-[600px]" />
              <div className="text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                PDF生成中...
              </div>
            </div>
          )}

          {/* PDFプレビュー */}
          {!loading && pdfUrl && (
            <div className="space-y-4">
              <iframe
                src={pdfUrl}
                className="w-full h-[600px] border rounded-lg"
                title="PDF Preview"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  閉じる
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};