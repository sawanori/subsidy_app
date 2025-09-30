'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * KPIChartPreview - KPIグラフプレビュー
 *
 * 複数KPI指標の可視化
 */

interface KPIChartPreviewProps {
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
  labels: string[];
  title?: string;
  yLabel?: string;
}

export const KPIChartPreview: React.FC<KPIChartPreviewProps> = ({
  datasets,
  labels,
  title = 'KPI目標推移',
  yLabel,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (datasets && datasets.length > 0 && labels && labels.length > 0) {
      generateChart();
    }
  }, [datasets, labels]);

  const generateChart = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/charts/kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, labels, datasets, yLabel }),
      });

      if (!response.ok) {
        throw new Error('チャート生成に失敗しました');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'kpi-chart.png';
      link.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>KPIグラフ</CardTitle>
            <CardDescription>目標値の推移と比較</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateChart} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              更新
            </Button>
            {imageUrl && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </Alert>
        )}

        {loading && <Skeleton className="w-full h-[400px]" />}

        {!loading && imageUrl && (
          <div className="relative w-full">
            <img src={imageUrl} alt="KPI Chart" className="w-full h-auto rounded-lg border" />
          </div>
        )}

        {!loading && !imageUrl && !error && (
          <div className="text-center py-8 text-muted-foreground">
            KPIデータがありません
          </div>
        )}
      </CardContent>
    </Card>
  );
};