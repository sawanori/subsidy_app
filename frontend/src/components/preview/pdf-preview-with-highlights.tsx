'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  FileText,
  Highlighter,
  Eye,
  EyeOff,
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// PDF.js worker設定
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

/**
 * PDFプレビュー＋ハイライトコンポーネント
 * APP-407: bbox座標レイヤによる抽出箇所ハイライト
 */

interface ExtractedField {
  id: string;
  fieldName: string;
  value: string;
  confidence: number;
  page: number;
  boundingBox: BoundingBox;
  isHighlighted?: boolean;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PdfPreviewWithHighlightsProps {
  pdfUrl: string;
  extractedFields?: ExtractedField[];
  onFieldClick?: (field: ExtractedField) => void;
  enableHighlights?: boolean;
  currentPage?: number;
}

export function PdfPreviewWithHighlights({
  pdfUrl,
  extractedFields = [],
  onFieldClick,
  enableHighlights = true,
  currentPage: initialPage = 1,
}: PdfPreviewWithHighlightsProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [showHighlights, setShowHighlights] = useState<boolean>(enableHighlights);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>();
  const containerRef = useRef<HTMLDivElement>(null);

  // ページ変更時にスクロール
  useEffect(() => {
    setPageNumber(initialPage);
  }, [initialPage]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page: any) => {
    setPageSize({
      width: page.width,
      height: page.height,
    });
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPage = prevPageNumber + offset;
      return Math.max(1, Math.min(newPage, numPages));
    });
  };

  const changeScale = (delta: number) => {
    setScale((prevScale) => {
      const newScale = prevScale + delta;
      return Math.max(0.5, Math.min(newScale, 3.0));
    });
  };

  const handleFieldClick = (field: ExtractedField) => {
    setSelectedField(field.id);
    setPageNumber(field.page);
    onFieldClick?.(field);
  };

  const renderHighlights = () => {
    if (!showHighlights || !pageSize) return null;

    const pageFields = extractedFields.filter((f) => f.page === pageNumber);

    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          width: pageSize.width * scale,
          height: pageSize.height * scale,
        }}
      >
        {pageFields.map((field) => {
          const isSelected = field.id === selectedField;
          const confidence = field.confidence || 1;
          const opacity = 0.2 + confidence * 0.3; // 0.2-0.5

          return (
            <div
              key={field.id}
              className="absolute pointer-events-auto cursor-pointer transition-all duration-200"
              style={{
                left: field.boundingBox.x * scale,
                top: field.boundingBox.y * scale,
                width: field.boundingBox.width * scale,
                height: field.boundingBox.height * scale,
                backgroundColor: getHighlightColor(confidence),
                opacity: isSelected ? opacity + 0.2 : opacity,
                border: isSelected ? '2px solid blue' : 'none',
              }}
              onClick={() => handleFieldClick(field)}
              title={`${field.fieldName}: ${field.value} (${Math.round(confidence * 100)}%)`}
            >
              {isSelected && (
                <div className="absolute -top-6 left-0 bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  {field.fieldName}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getHighlightColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'rgba(34, 197, 94, 0.3)'; // green
    if (confidence >= 0.7) return 'rgba(251, 191, 36, 0.3)'; // yellow
    return 'rgba(239, 68, 68, 0.3)'; // red
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.9) return '高';
    if (confidence >= 0.7) return '中';
    return '低';
  };

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 0.9) return 'default';
    if (confidence >= 0.7) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="flex gap-4">
      {/* メインPDFビューア */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDFプレビュー
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHighlights(!showHighlights)}
                className="gap-2"
              >
                {showHighlights ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    ハイライトを非表示
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    ハイライトを表示
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                ダウンロード
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* コントロール */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                ページ {pageNumber} / {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(1)}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeScale(-0.1)}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeScale(0.1)}
                disabled={scale >= 3.0}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale(1.0)}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PDFレンダリング */}
          <ScrollArea className="h-[600px] border rounded-lg">
            <div
              ref={containerRef}
              className="relative flex items-center justify-center p-4"
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-96 text-destructive">
                    PDFの読み込みに失敗しました
                  </div>
                }
              >
                <div className="relative">
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    onLoadSuccess={onPageLoadSuccess}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                  {renderHighlights()}
                </div>
              </Document>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* サイドバー: 抽出フィールドリスト */}
      {extractedFields.length > 0 && (
        <Card className="w-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Highlighter className="h-4 w-4" />
              抽出フィールド
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {extractedFields.map((field) => (
                  <div
                    key={field.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedField === field.id ? 'border-primary bg-muted' : ''
                    }`}
                    onClick={() => handleFieldClick(field)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium">{field.fieldName}</span>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={getConfidenceBadgeVariant(field.confidence)}
                          className="text-xs"
                        >
                          {getConfidenceLabel(field.confidence)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          P{field.page}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {field.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      信頼度: {Math.round(field.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}