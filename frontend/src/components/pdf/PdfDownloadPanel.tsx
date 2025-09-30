'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, AlertCircle, Loader2, Eye } from 'lucide-react';

/**
 * PdfDownloadPanel - PDF出力パネル
 *
 * Phase 5: PDF生成・ダウンロード・プレビュー機能
 */

interface PdfDownloadPanelProps {
  draftId: string;
  draftVersion?: number;
  onDownloadComplete?: () => void;
}

export const PdfDownloadPanel: React.FC<PdfDownloadPanelProps> = ({
  draftId,
  draftVersion,
  onDownloadComplete
}) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async (type: 'full' | 'summary' = 'full') => {
    setGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint = type === 'full'
        ? `/api/pdf-generator/draft/${draftId}`
        : `/api/pdf-generator/draft/${draftId}/summary`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('PDF生成に失敗しました');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = type === 'full'
        ? `application_${draftId}.pdf`
        : `summary_${draftId}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
      setSuccess(true);

      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async () => {
    setGenerating(true);
    setError(null);

    try {
      const url = `/api/pdf-generator/draft/${draftId}/preview`;
      window.open(url, '_blank');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF出力
        </CardTitle>
        <CardDescription>
          補助金申請書をPDF形式でダウンロードします
        </CardDescription>
        {draftVersion && (
          <div className="text-sm text-muted-foreground">
            バージョン: {draftVersion}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 成功表示 */}
        {success && !error && (
          <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
            <FileText className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              PDF生成が完了しました
            </AlertDescription>
          </Alert>
        )}

        {/* ダウンロードボタン */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 完全版PDF */}
          <Button
            onClick={() => handleDownload('full')}
            disabled={generating}
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                完全版PDF
              </>
            )}
          </Button>

          {/* サマリーPDF */}
          <Button
            onClick={() => handleDownload('summary')}
            disabled={generating}
            variant="outline"
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                サマリーPDF
              </>
            )}
          </Button>

          {/* プレビュー */}
          <Button
            onClick={handlePreview}
            disabled={generating}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                プレビュー
              </>
            )}
          </Button>
        </div>

        {/* 説明 */}
        <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
          <p><strong>完全版PDF:</strong> 全セクション、図表、詳細情報を含む完全な申請書</p>
          <p><strong>サマリーPDF:</strong> 統計情報と概要のみの簡易レポート</p>
          <p><strong>プレビュー:</strong> ブラウザで内容を確認（別タブで開きます）</p>
        </div>

        {/* ファイル情報 */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <div className="font-medium mb-1">出力情報</div>
          <div>形式: PDF (A4)</div>
          <div>Draft ID: {draftId}</div>
          <div>推定ファイルサイズ: 1-5 MB</div>
        </div>
      </CardContent>
    </Card>
  );
};