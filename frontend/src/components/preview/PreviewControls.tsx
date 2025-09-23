'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { PreviewConfig } from '@/types/preview';
import { ZoomIn, ZoomOut, Grid, Droplets, Download, RefreshCw, Maximize2 } from 'lucide-react';

interface PreviewControlsProps {
  config: PreviewConfig;
  onConfigChange: (updates: Partial<PreviewConfig>) => void;
  onRefresh: () => void;
  onDownload: () => void;
  onFullscreen: () => void;
  isLoading?: boolean;
}

export function PreviewControls({
  config,
  onConfigChange,
  onRefresh,
  onDownload,
  onFullscreen,
  isLoading = false
}: PreviewControlsProps) {
  
  const handleScaleChange = (value: number[]) => {
    onConfigChange({ scale: value[0] });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-background border-b">
      {/* 表示モード */}
      <div className="flex items-center gap-2">
        <Label htmlFor="display-mode" className="text-sm font-medium">
          表示:
        </Label>
        <Select 
          value={config.displayMode} 
          onValueChange={(value) => onConfigChange({ displayMode: value as any })}
        >
          <SelectTrigger className="w-20" id="display-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="both">両方</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ズーム調整 */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onConfigChange({ scale: Math.max(0.5, config.scale - 0.1) })}
          disabled={config.scale <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="w-20 px-2">
          <Slider
            value={[config.scale]}
            onValueChange={handleScaleChange}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onConfigChange({ scale: Math.min(2.0, config.scale + 0.1) })}
          disabled={config.scale >= 2.0}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-mono min-w-12 text-center">
          {Math.round(config.scale * 100)}%
        </span>
      </div>

      {/* グリッド表示 */}
      <div className="flex items-center gap-2">
        <Switch
          id="show-grid"
          checked={config.showGrid}
          onCheckedChange={(checked) => onConfigChange({ showGrid: checked })}
        />
        <Label htmlFor="show-grid" className="text-sm">
          <Grid className="h-4 w-4 inline mr-1" />
          グリッド
        </Label>
      </div>

      {/* 透かし表示 */}
      <div className="flex items-center gap-2">
        <Switch
          id="show-watermark"
          checked={config.showWatermark}
          onCheckedChange={(checked) => onConfigChange({ showWatermark: checked })}
        />
        <Label htmlFor="show-watermark" className="text-sm">
          <Droplets className="h-4 w-4 inline mr-1" />
          透かし
        </Label>
      </div>

      <div className="flex-1" />

      {/* アクションボタン */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          更新
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={isLoading}
        >
          <Download className="h-4 w-4" />
          PDF
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
          全画面
        </Button>
      </div>
    </div>
  );
}