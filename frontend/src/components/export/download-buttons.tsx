'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Download,
  FileText,
  FileJson,
  FolderArchive,
  ChevronDown,
  FileCheck,
  Shield,
  Clock,
  HardDrive,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

/**
 * ダウンロードボタンコンポーネント
 * APP-422: PDF/監査JSON/一式ZIP
 */

interface DownloadOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  fileType: string;
  size?: number;
  available: boolean;
  url?: string;
}

interface DownloadButtonsProps {
  applicationId: string;
  documentId?: string;
  showDetails?: boolean;
  onDownload?: (option: DownloadOption) => void;
}

export function DownloadButtons({
  applicationId,
  documentId,
  showDetails = true,
  onDownload,
}: DownloadButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<string[]>([]);

  const downloadOptions: DownloadOption[] = [
    {
      id: 'main-pdf',
      label: '申請書PDF',
      description: '最終版の申請書（電子印影付き）',
      icon: <FileText className="h-4 w-4" />,
      fileType: 'PDF',
      size: 2048000, // 2MB
      available: true,
      url: `/api/applications/${applicationId}/export/pdf`,
    },
    {
      id: 'audit-json',
      label: '監査JSON',
      description: '生成履歴・検証結果・コスト情報',
      icon: <FileJson className="h-4 w-4" />,
      fileType: 'JSON',
      size: 512000, // 500KB
      available: true,
      url: `/api/applications/${applicationId}/export/audit`,
    },
    {
      id: 'complete-zip',
      label: '一式ZIP',
      description: '申請書・添付資料・エビデンス全て',
      icon: <FolderArchive className="h-4 w-4" />,
      fileType: 'ZIP',
      size: 10240000, // 10MB
      available: true,
      url: `/api/applications/${applicationId}/export/complete`,
    },
    {
      id: 'attachments-only',
      label: '添付資料',
      description: 'エビデンス・補足資料のみ',
      icon: <Package className="h-4 w-4" />,
      fileType: 'ZIP',
      size: 5120000, // 5MB
      available: true,
      url: `/api/applications/${applicationId}/export/attachments`,
    },
    {
      id: 'excel-data',
      label: 'データExcel',
      description: '申請データのExcelエクスポート',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      fileType: 'XLSX',
      size: 1024000, // 1MB
      available: true,
      url: `/api/applications/${applicationId}/export/excel`,
    },
    {
      id: 'validation-report',
      label: '検証レポート',
      description: 'プリフライト・検証結果の詳細',
      icon: <Shield className="h-4 w-4" />,
      fileType: 'PDF',
      size: 512000, // 500KB
      available: documentId !== undefined,
      url: `/api/documents/${documentId}/validation-report`,
    },
  ];

  /**
   * ダウンロード処理
   */
  const handleDownload = async (option: DownloadOption) => {
    if (!option.available || !option.url) return;

    setDownloadingId(option.id);
    setIsLoading(true);

    try {
      // ダウンロードURL生成（署名付き）
      const response = await apiClient.post(option.url, {
        format: option.fileType.toLowerCase(),
        includeMetadata: true,
      });

      // ダウンロード実行
      const downloadUrl = response.downloadUrl || option.url;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getFileName(option);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 履歴に追加
      setDownloadHistory((prev) => [...prev, option.id]);
      onDownload?.(option);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(false);
      setDownloadingId(null);
    }
  };

  /**
   * ファイル名生成
   */
  const getFileName = (option: DownloadOption): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const extensions = {
      PDF: 'pdf',
      JSON: 'json',
      ZIP: 'zip',
      XLSX: 'xlsx',
    };
    const ext = extensions[option.fileType] || 'bin';
    return `${option.id}_${timestamp}.${ext}`;
  };

  /**
   * サイズ表示
   */
  const formatSize = (bytes?: number): string => {
    if (!bytes) return '不明';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  /**
   * 主要ダウンロード（PDF）
   */
  const mainOption = downloadOptions[0];

  /**
   * その他のオプション
   */
  const otherOptions = downloadOptions.slice(1);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {showDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                ダウンロード
              </CardTitle>
              <CardDescription>
                生成された申請書類をダウンロードできます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* メインダウンロードボタン */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleDownload(mainOption)}
                  disabled={!mainOption.available || downloadingId === mainOption.id}
                  className="gap-2 flex-1"
                >
                  {downloadingId === mainOption.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    mainOption.icon
                  )}
                  {mainOption.label}をダウンロード
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>その他のダウンロード</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {otherOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.id}
                        onClick={() => handleDownload(option)}
                        disabled={!option.available || downloadingId === option.id}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="mt-0.5">{option.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {option.fileType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatSize(option.size)}
                              </span>
                            </div>
                          </div>
                          {downloadHistory.includes(option.id) && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* ダウンロード済みインジケータ */}
              {downloadHistory.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {downloadHistory.length}個のファイルがダウンロード済みです
                  </AlertDescription>
                </Alert>
              )}

              {/* ファイル詳細 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">利用可能なファイル</h4>
                <div className="grid gap-2">
                  {downloadOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        option.available ? 'hover:bg-muted/50' : 'opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {option.icon}
                        <div>
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {option.fileType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatSize(option.size)}
                        </span>
                        {option.available ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(option)}
                                disabled={downloadingId === option.id}
                              >
                                {downloadingId === option.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : downloadHistory.includes(option.id) ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {downloadHistory.includes(option.id)
                                ? 'ダウンロード済み'
                                : 'ダウンロード'}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ストレージ情報 */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>合計サイズ: {formatSize(
                    downloadOptions.reduce((sum, opt) => sum + (opt.size || 0), 0)
                  )}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>生成日時: {new Date().toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* シンプルモード */}
        {!showDetails && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleDownload(mainOption)}
              disabled={!mainOption.available || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDFダウンロード
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  その他
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {otherOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => handleDownload(option)}
                    disabled={!option.available}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {option.fileType}
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}