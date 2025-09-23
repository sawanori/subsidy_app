'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Download, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Settings, 
  FileText,
  Grid,
  Droplets,
  Loader2
} from 'lucide-react';
import { usePreview, usePreviewAutoUpdate } from '@/contexts/PreviewContext';
import { PreviewRenderer } from './PreviewRenderer';
import { PreviewControls } from './PreviewControls';

interface PreviewPanelProps {
  className?: string;
}

export function PreviewPanel({ className = '' }: PreviewPanelProps) {
  const t = useTranslations();
  const { formData, config, state, updateConfig, generatePreview } = usePreview();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // 自動更新の状態を監視
  const autoUpdateState = usePreviewAutoUpdate(1500);

  const handleScaleChange = useCallback((newScale: number) => {
    updateConfig({ scale: Math.max(0.5, Math.min(2.0, newScale)) });
  }, [updateConfig]);

  const handleFormTypeChange = useCallback((formType: string) => {
    updateConfig({ formType: formType as any });
  }, [updateConfig]);

  const handleDisplayModeChange = useCallback((displayMode: string) => {
    updateConfig({ displayMode: displayMode as any });
  }, [updateConfig]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen && panelRef.current) {
      panelRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const handleDownload = useCallback(async () => {
    if (state.isLoading) return;
    
    try {
      // 実際の実装では、PDFダウンロードAPIを呼び出し
      console.log('Downloading preview:', { formType: config.formType, formData });
      // const response = await fetch(`/api/preview/download/${config.formType}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [state.isLoading, config.formType, formData]);

  return (
    <div 
      ref={panelRef}
      className={`flex flex-col h-full bg-background border-l ${className}`}
      role="region"
      aria-label={t('subsidy.details')}
    >
      {/* ヘッダー */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg">
              プレビュー
            </CardTitle>
            {state.isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={state.error ? 'destructive' : 'secondary'}>
              {state.error ? 'エラー' : '準備完了'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* コントロール */}
      <div className="px-6 pb-4">
        <Tabs value={config.formType} onValueChange={handleFormTypeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="form1" className="text-xs">
              様式1
            </TabsTrigger>
            <TabsTrigger value="form2" className="text-xs">
              様式2
            </TabsTrigger>
            <TabsTrigger value="form4" className="text-xs">
              様式4
            </TabsTrigger>
            <TabsTrigger value="confirmation" className="text-xs">
              確認書
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 mt-4">
          <Select value={config.displayMode} onValueChange={handleDisplayModeChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="both">両方</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleScaleChange(config.scale - 0.1)}
            disabled={config.scale <= 0.5}
            aria-label="縮小"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-mono min-w-16 text-center">
            {Math.round(config.scale * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleScaleChange(config.scale + 0.1)}
            disabled={config.scale >= 2.0}
            aria-label="拡大"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig({ showGrid: !config.showGrid })}
            aria-pressed={config.showGrid}
            aria-label="グリッド表示切替"
          >
            <Grid className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig({ showWatermark: !config.showWatermark })}
            aria-pressed={config.showWatermark}
            aria-label="透かし表示切替"
          >
            <Droplets className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={generatePreview}
            disabled={state.isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
            更新
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={state.isLoading || !state.lastGenerated}
          >
            <Download className="h-4 w-4" />
            ダウンロード
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            <Settings className="h-4 w-4" />
            {isFullscreen ? '通常表示' : '全画面'}
          </Button>
        </div>
      </div>

      {/* プレビュー表示エリア */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        {state.error ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                プレビューエラー
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                {state.error}
              </p>
              <Button onClick={generatePreview} variant="outline">
                再試行
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full relative">
            <PreviewRenderer
              formData={formData}
              config={config}
              isLoading={state.isLoading}
              className="absolute inset-0"
            />
          </div>
        )}
      </CardContent>

      {/* ステータスバー */}
      <div className="border-t px-6 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            最終更新: {state.lastGenerated ? 
              new Date(state.lastGenerated).toLocaleTimeString('ja-JP') : 
              '未生成'
            }
          </span>
          <span>
            v{formData.version} | {config.formType.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}