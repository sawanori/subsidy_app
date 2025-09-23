'use client';

import React, { useMemo } from 'react';
import { SubsidyFormData, PreviewConfig } from '@/types/preview';
import { Skeleton } from '@/components/ui/skeleton';
import { FormOnePreview } from './forms/FormOnePreview';
import { FormTwoPreview } from './forms/FormTwoPreview';
import { FormFourPreview } from './forms/FormFourPreview';
import { ConfirmationPreview } from './forms/ConfirmationPreview';

interface PreviewRendererProps {
  formData: SubsidyFormData;
  config: PreviewConfig;
  isLoading: boolean;
  className?: string;
}

export function PreviewRenderer({ 
  formData, 
  config, 
  isLoading, 
  className = '' 
}: PreviewRendererProps) {
  
  const previewComponent = useMemo(() => {
    const commonProps = {
      formData,
      config,
      className: 'w-full h-full',
    };

    switch (config.formType) {
      case 'form1':
        return <FormOnePreview {...commonProps} />;
      case 'form2':
        return <FormTwoPreview {...commonProps} />;
      case 'form4':
        return <FormFourPreview {...commonProps} />;
      case 'confirmation':
        return <ConfirmationPreview {...commonProps} />;
      default:
        return <FormOnePreview {...commonProps} />;
    }
  }, [formData, config]);

  if (isLoading) {
    return (
      <div className={`${className} p-6 space-y-4`}>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-2 mt-6">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2 mt-6">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        transform: `scale(${config.scale})`,
        transformOrigin: 'top left',
        backgroundImage: config.showGrid ? 
          'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)' :
          undefined,
        backgroundSize: config.showGrid ? '20px 20px' : undefined,
      }}
      role="document"
      aria-label={`${config.formType}のプレビュー`}
    >
      <div className="relative">
        {config.showWatermark && (
          <div 
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
            style={{ 
              background: 'url("data:image/svg+xml,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Ctext x="50%" y="50%" font-family="Arial" font-size="24" fill="rgba(0,0,0,0.05)" text-anchor="middle" dominant-baseline="middle" transform="rotate(-45 100 100)"%3EDRAFT%3C/text%3E%3C/svg%3E") repeat',
            }}
            aria-hidden="true"
          />
        )}
        
        {config.displayMode === 'both' ? (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="border-r">
              <div className="text-sm font-medium p-2 bg-muted">HTML版</div>
              {previewComponent}
            </div>
            <div>
              <div className="text-sm font-medium p-2 bg-muted">PDF版</div>
              <div className="p-4 bg-gray-50 h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-2">📄</div>
                  <p>PDF プレビュー</p>
                  <p className="text-xs">実装中...</p>
                </div>
              </div>
            </div>
          </div>
        ) : config.displayMode === 'pdf' ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-muted-foreground">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">PDF プレビュー</h3>
              <p className="text-sm">PDF.js統合実装中...</p>
              <p className="text-xs mt-2">現在はHTML版で代替表示</p>
            </div>
          </div>
        ) : (
          previewComponent
        )}
      </div>
    </div>
  );
}