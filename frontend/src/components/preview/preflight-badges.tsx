'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Type,
  Maximize,
  Stamp,
  AlertCircle,
} from 'lucide-react';

/**
 * プリフライトバッジコンポーネント
 * APP-411: ページ/フォント/禁則/押印チェック表示
 */

interface PreflightResult {
  passed: boolean;
  errors: PreflightError[];
  warnings: PreflightWarning[];
  metadata: PreflightMetadata;
}

interface PreflightError {
  code: string;
  message: string;
  ruleId?: string;
  details?: any;
}

interface PreflightWarning {
  code: string;
  message: string;
  ruleId?: string;
  details?: any;
}

interface PreflightMetadata {
  pageCount: number;
  hasEmbeddedFonts: boolean;
  hasMargins: boolean;
  hasStampSpace: boolean;
  fontSize?: number;
  resolution?: number;
  colorSpace?: string;
  pdfVersion?: string;
}

interface PreflightBadgesProps {
  preflightResult: PreflightResult;
  showDetails?: boolean;
}

export function PreflightBadges({
  preflightResult,
  showDetails = true,
}: PreflightBadgesProps) {
  const { passed, errors, warnings, metadata } = preflightResult;

  const getPageCountBadge = () => {
    const pageCount = metadata.pageCount;
    const maxPages = 20; // 例: 最大20ページ

    if (pageCount <= maxPages) {
      return (
        <Badge variant="default" className="gap-1">
          <FileText className="h-3 w-3" />
          {pageCount}ページ
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <FileText className="h-3 w-3" />
        {pageCount}ページ (上限{maxPages})
      </Badge>
    );
  };

  const getFontBadge = () => {
    if (metadata.hasEmbeddedFonts) {
      return (
        <Badge variant="default" className="gap-1">
          <Type className="h-3 w-3" />
          フォント埋込済
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <Type className="h-3 w-3" />
        フォント未埋込
      </Badge>
    );
  };

  const getMarginBadge = () => {
    if (metadata.hasMargins) {
      return (
        <Badge variant="default" className="gap-1">
          <Maximize className="h-3 w-3" />
          余白OK
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <Maximize className="h-3 w-3" />
        余白不足
      </Badge>
    );
  };

  const getStampBadge = () => {
    if (metadata.hasStampSpace) {
      return (
        <Badge variant="default" className="gap-1">
          <Stamp className="h-3 w-3" />
          押印位置OK
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="gap-1 bg-yellow-100 text-yellow-800">
        <Stamp className="h-3 w-3" />
        押印位置確認
      </Badge>
    );
  };

  const getOverallBadge = () => {
    if (passed) {
      return (
        <Badge variant="default" className="gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          プリフライト合格
        </Badge>
      );
    }
    if (errors.length > 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          エラー {errors.length}件
        </Badge>
      );
    }
    if (warnings.length > 0) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          警告 {warnings.length}件
        </Badge>
      );
    }
    return null;
  };

  const getErrorMessages = () => {
    const errorMap: Record<string, string> = {
      ERR_PREFLIGHT_PAGE_LIMIT: 'ページ数が上限を超えています',
      ERR_PREFLIGHT_FONT_MISSING: '必須フォントが埋め込まれていません',
      ERR_PREFLIGHT_FONT_MISMATCH: 'フォントバージョンが一致しません',
      ERR_PREFLIGHT_MARGIN: '余白が不足しています',
      ERR_PREFLIGHT_RESOLUTION: '解像度が低すぎます',
      ERR_PREFLIGHT_COLOR_SPACE: '色空間が不正です',
    };

    return errors.map((error) => (
      errorMap[error.code] || error.message
    ));
  };

  return (
    <div className="space-y-3">
      {/* バッジ行 */}
      <div className="flex flex-wrap items-center gap-2">
        {getOverallBadge()}
        {getPageCountBadge()}
        {getFontBadge()}
        {getMarginBadge()}
        {getStampBadge()}
        
        {/* 追加メタデータ */}
        {metadata.pdfVersion && (
          <Badge variant="outline" className="text-xs">
            PDF {metadata.pdfVersion}
          </Badge>
        )}
        {metadata.resolution && (
          <Badge
            variant={metadata.resolution >= 300 ? 'outline' : 'secondary'}
            className="text-xs"
          >
            {metadata.resolution} DPI
          </Badge>
        )}
      </div>

      {/* 詳細表示 */}
      {showDetails && (errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          {/* エラー */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">プリフライトエラー</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.map((error, index) => (
                    <li key={index}>
                      {error.message}
                      {error.ruleId && (
                        <span className="text-xs ml-1">
                          (Rule: {error.ruleId})
                        </span>
                      )}
                      {error.details && (
                        <div className="ml-4 mt-1 text-xs text-muted-foreground">
                          {JSON.stringify(error.details)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 警告 */}
          {warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">プリフライト警告</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {warnings.map((warning, index) => (
                    <li key={index}>
                      {warning.message}
                      {warning.ruleId && (
                        <span className="text-xs ml-1">
                          (Rule: {warning.ruleId})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 修正方法 */}
          {errors.some((e) => e.code === 'ERR_PREFLIGHT_FONT_MISSING') && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">修正方法</div>
                <p className="text-sm">
                  PDF作成時に、「フォントを埋め込む」オプションを有効にしてください。
                  推奨フォント: Noto Sans CJK JP
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}