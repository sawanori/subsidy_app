'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Download, 
  RefreshCw, 
  Settings, 
  FileText,
  Maximize2,
  Clock,
  Zap
} from 'lucide-react';
import { 
  useExpensiveComputation, 
  useDebounce,
  usePerformanceMonitor,
  createMemoComparison
} from '@/hooks/usePerformanceOptimization';
import { FormOnePreview } from './forms/FormOnePreview';
import { FormTwoPreview } from './forms/FormTwoPreview';
import { FormFourPreview } from './forms/FormFourPreview';
import { ConfirmationPreview } from './forms/ConfirmationPreview';
import { PreviewData, PreviewConfig, FormType } from '@/types/preview';

interface OptimizedPreviewPanelProps {
  data: PreviewData;
  config: PreviewConfig;
  onConfigChange: (config: PreviewConfig) => void;
  onExport?: (format: 'pdf' | 'png') => Promise<void>;
  className?: string;
  isFullscreen?: boolean;
}

/**
 * APP-240: パフォーマンス最適化済みPreviewPanel
 * React.memo + useMemo + Virtual DOM最適化実装
 */
export const OptimizedPreviewPanel = memo<OptimizedPreviewPanelProps>(({
  data,
  config,
  onConfigChange,
  onExport,
  className = '',
  isFullscreen = false
}) => {
  const t = useTranslations();
  const { markStart, markEnd } = usePerformanceMonitor('OptimizedPreviewPanel');
  
  // デバウンス処理でレンダリング頻度を制限（2秒以内表示保証）
  const debouncedData = useDebounce(data, 100);
  const debouncedConfig = useDebounce(config, 150);
  
  // 高コストな計算の最適化
  const previewStats = useExpensiveComputation(
    { data: debouncedData, config: debouncedConfig },
    ({ data, config }) => {
      markStart();
      
      const stats = {
        totalFields: Object.keys(data.form1 || {}).length + 
                    Object.keys(data.form2 || {}).length + 
                    Object.keys(data.form4 || {}).length,
        completedFields: 0,
        formProgress: {} as Record<FormType, number>,
        estimatedPdfSize: 0,
        renderTime: 0
      };
      
      // フォーム別完成度計算
      const forms: Array<{ type: FormType; data: any }> = [
        { type: 'form1', data: data.form1 },
        { type: 'form2', data: data.form2 },
        { type: 'form4', data: data.form4 },
        { type: 'confirmation', data: data.confirmation }
      ];
      
      forms.forEach(({ type, data: formData }) => {
        if (!formData) {
          stats.formProgress[type] = 0;
          return;
        }
        
        const fields = Object.values(formData);
        const completed = fields.filter(v => v && v !== '').length;
        stats.formProgress[type] = fields.length > 0 ? (completed / fields.length) * 100 : 0;
        stats.completedFields += completed;
      });
      
      // PDF推定サイズ計算
      stats.estimatedPdfSize = Math.max(50, stats.totalFields * 1.2); // KB
      
      stats.renderTime = markEnd('previewStats calculation');
      return stats;
    },
    [debouncedData, debouncedConfig]
  );
  
  // メモ化されたフォームレンダラー
  const formRenderer = useMemo(() => {
    const renderers = {
      form1: FormOnePreview,
      form2: FormTwoPreview,
      form4: FormFourPreview,
      confirmation: ConfirmationPreview
    };
    
    return renderers[debouncedConfig.activeForm] || FormOnePreview;
  }, [debouncedConfig.activeForm]);
  
  // メモ化されたイベントハンドラー
  const handleConfigChange = useCallback((updates: Partial<PreviewConfig>) => {
    onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);
  
  const handleExport = useCallback(async (format: 'pdf' | 'png') => {
    if (!onExport) return;
    
    markStart();
    await onExport(format);
    markEnd(`export ${format}`);
  }, [onExport, markStart, markEnd]);
  
  const handleFormSwitch = useCallback((formType: FormType) => {
    handleConfigChange({ activeForm: formType });
  }, [handleConfigChange]);
  
  // Virtual DOM用のスタイル最適化
  const optimizedStyles = useMemo(() => ({
    container: {
      height: isFullscreen ? '100vh' : '600px',
      transform: `scale(${debouncedConfig.zoom})`,
      transformOrigin: 'top left',
      transition: 'transform 0.2s ease-out'
    },
    content: {
      willChange: 'transform',
      backfaceVisibility: 'hidden' as const,
      perspective: 1000
    }
  }), [isFullscreen, debouncedConfig.zoom]);
  
  const FormComponent = formRenderer;
  
  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">リアルタイムプレビュー</CardTitle>
              <CardDescription>
                2秒以内表示・差分最適化・worker3統合
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              APP-240最適化
            </Badge>
            
            <Badge variant={previewStats.renderTime < 16 ? "default" : "destructive"}>
              <Clock className="h-3 w-3 mr-1" />
              {previewStats.renderTime.toFixed(1)}ms
            </Badge>
            
            {!isFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleConfigChange({ fullscreen: true })}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* プログレス表示 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>フォーム完成度</span>
            <span>{Math.round(previewStats.formProgress[debouncedConfig.activeForm] || 0)}%</span>
          </div>
          <Progress 
            value={previewStats.formProgress[debouncedConfig.activeForm] || 0} 
            className="h-2" 
          />
        </div>
      </CardHeader>
      
      <CardContent style={optimizedStyles.content}>
        <Tabs value={debouncedConfig.activeForm} onValueChange={handleFormSwitch}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="form1" className="text-xs">
              様式1 ({Math.round(previewStats.formProgress.form1 || 0)}%)
            </TabsTrigger>
            <TabsTrigger value="form2" className="text-xs">
              様式2 ({Math.round(previewStats.formProgress.form2 || 0)}%)
            </TabsTrigger>
            <TabsTrigger value="form4" className="text-xs">
              様式4 ({Math.round(previewStats.formProgress.form4 || 0)}%)
            </TabsTrigger>
            <TabsTrigger value="confirmation" className="text-xs">
              確認 ({Math.round(previewStats.formProgress.confirmation || 0)}%)
            </TabsTrigger>
          </TabsList>
          
          <div 
            className="preview-container bg-white border border-gray-200 rounded overflow-auto"
            style={optimizedStyles.container}
          >
            <TabsContent value={debouncedConfig.activeForm} className="mt-0 h-full">
              <FormComponent
                data={debouncedData}
                config={debouncedConfig}
                className="h-full"
              />
            </TabsContent>
          </div>
        </Tabs>
        
        {/* コントロールパネル */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>完了フィールド: {previewStats.completedFields}</span>
            <span>•</span>
            <span>推定PDF: {previewStats.estimatedPdfSize.toFixed(1)}KB</span>
            <span>•</span>
            <span>レンダリング: {previewStats.renderTime.toFixed(1)}ms</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <label className="text-xs text-gray-600">倍率:</label>
              <select
                value={debouncedConfig.zoom}
                onChange={(e) => handleConfigChange({ zoom: parseFloat(e.target.value) })}
                className="text-xs border rounded px-1"
              >
                <option value="0.5">50%</option>
                <option value="0.75">75%</option>
                <option value="1">100%</option>
                <option value="1.25">125%</option>
                <option value="1.5">150%</option>
              </select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={!onExport}
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfigChange({ showGrid: !debouncedConfig.showGrid })}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, createMemoComparison(['data', 'config', 'isFullscreen']));

OptimizedPreviewPanel.displayName = 'OptimizedPreviewPanel';