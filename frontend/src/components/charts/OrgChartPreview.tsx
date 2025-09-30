'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * OrgChartPreview - 組織図プレビュー
 *
 * チーム体制の可視化
 */

interface OrgChartPreviewProps {
  members: Array<{
    name: string;
    role: string;
    allocation: number;
  }>;
  title?: string;
}

export const OrgChartPreview: React.FC<OrgChartPreviewProps> = ({
  members,
  title = 'プロジェクト体制',
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (members && members.length > 0) {
      generateChart();
    }
  }, [members]);

  const generateChart = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/charts/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, members }),
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
      link.download = 'org-chart.png';
      link.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>組織図</CardTitle>
            <CardDescription>チーム体制と工数配分</CardDescription>
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
            <img src={imageUrl} alt="Organization Chart" className="w-full h-auto rounded-lg border" />
          </div>
        )}

        {!loading && !imageUrl && !error && (
          <div className="text-center py-8 text-muted-foreground">
            チームメンバーデータがありません
          </div>
        )}
      </CardContent>
    </Card>
  );
};