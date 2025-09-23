'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PdfDownloadButtonProps {
  applicationId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function PdfDownloadButton({
  applicationId,
  variant = 'default',
  size = 'default',
}: PdfDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleDownload = async (type: 'full' | 'summary') => {
    setIsLoading(true);
    
    try {
      const endpoint = type === 'full' 
        ? `${apiUrl}/api/pdf-generator/application/${applicationId}`
        : `${apiUrl}/api/pdf-generator/application/${applicationId}/summary`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('PDF生成に失敗しました');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'full' 
        ? `application_${applicationId}.pdf`
        : `summary_${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDFのダウンロードが完了しました');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('PDFのダウンロードに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    setIsLoading(true);
    
    try {
      const endpoint = `${apiUrl}/api/pdf-generator/application/${applicationId}/preview`;
      window.open(endpoint, '_blank');
      toast.success('PDFプレビューを開きました');
    } catch (error) {
      console.error('PDF preview error:', error);
      toast.error('PDFプレビューに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              PDF出力
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>PDF出力オプション</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDownload('full')}>
          <FileText className="mr-2 h-4 w-4" />
          完全版申請書
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('summary')}>
          <FileText className="mr-2 h-4 w-4" />
          サマリーレポート
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePreview}>
          <Eye className="mr-2 h-4 w-4" />
          プレビュー
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}