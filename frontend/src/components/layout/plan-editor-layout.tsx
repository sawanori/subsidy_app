'use client';

import React, { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  Eye,
  EyeOff,
  Settings,
  FileText,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PlanEditorLayoutProps {
  children?: ReactNode;
  formContent: ReactNode;
  previewContent: ReactNode;
  onSave?: () => void;
  onExport?: () => void;
  isSaving?: boolean;
  isExporting?: boolean;
}

export function PlanEditorLayout({
  formContent,
  previewContent,
  onSave,
  onExport,
  isSaving = false,
  isExporting = false,
}: PlanEditorLayoutProps) {
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  const togglePreviewCollapse = () => {
    setIsPreviewCollapsed(!isPreviewCollapsed);
  };

  const togglePreviewVisibility = () => {
    setIsPreviewVisible(!isPreviewVisible);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header Bar */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">補助金申請書作成</h1>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePreviewVisibility}
                  className="h-8 w-8"
                >
                  {isPreviewVisible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isPreviewVisible ? 'プレビューを非表示' : 'プレビューを表示'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '保存中...' : '保存'}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'エクスポート中...' : 'エクスポート'}
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Form Panel (Left) */}
        <div
          className={cn(
            'flex flex-col border-r transition-all duration-300',
            isPreviewVisible && !isPreviewCollapsed
              ? 'w-1/2'
              : isPreviewVisible && isPreviewCollapsed
              ? 'w-2/3'
              : 'w-full'
          )}
        >
          <ScrollArea className="flex-1 p-6">
            <div className="mx-auto max-w-3xl">{formContent}</div>
          </ScrollArea>
        </div>

        {/* Divider with Collapse Button */}
        {isPreviewVisible && (
          <div className="relative">
            <button
              onClick={togglePreviewCollapse}
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background border p-1 shadow-md hover:bg-accent transition-colors"
              aria-label={isPreviewCollapsed ? 'プレビューを拡大' : 'プレビューを縮小'}
            >
              {isPreviewCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {/* Preview Panel (Right) */}
        {isPreviewVisible && (
          <div
            className={cn(
              'flex flex-col bg-muted/30 transition-all duration-300',
              isPreviewCollapsed ? 'w-1/3' : 'w-1/2'
            )}
          >
            <div className="flex h-12 items-center justify-between border-b bg-background px-4">
              <h2 className="text-sm font-medium">プレビュー</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  自動更新
                </span>
                <div className="h-2 w-2 rounded-full bg-status-success animate-pulse" />
              </div>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="mx-auto max-w-2xl">{previewContent}</div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <footer className="flex h-8 items-center justify-between border-t px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>文字数: 1,234 / 5,000</span>
          <span>ページ数: 3 / 10</span>
        </div>
        <div className="flex items-center gap-4">
          <span>最終保存: 5分前</span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-status-success" />
            すべて正常
          </span>
        </div>
      </footer>
    </div>
  );
}

// レスポンシブ対応版
export function ResponsivePlanEditorLayout({
  formContent,
  previewContent,
  onSave,
  onExport,
  isSaving = false,
  isExporting = false,
}: PlanEditorLayoutProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <PlanEditorLayout
          formContent={formContent}
          previewContent={previewContent}
          onSave={onSave}
          onExport={onExport}
          isSaving={isSaving}
          isExporting={isExporting}
        />
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="flex h-screen flex-col lg:hidden">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <h1 className="text-lg font-semibold">補助金申請書作成</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('form')}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors',
              activeTab === 'form'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            )}
          >
            入力フォーム
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors',
              activeTab === 'preview'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            )}
          >
            プレビュー
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {activeTab === 'form' ? formContent : previewContent}
        </ScrollArea>
      </div>
    </>
  );
}