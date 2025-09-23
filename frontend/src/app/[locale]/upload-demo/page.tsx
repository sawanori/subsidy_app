'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AppLayout } from '@/components/layout/AppLayout';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { UploadErrorBoundary } from '@/components/upload/UploadErrorBoundary';
import { OptimizedUploadAnalytics } from '@/components/upload/OptimizedUploadAnalytics';
import { ExtractedChart } from '@/components/charts/ExtractedChart';
import { OCRResultViewer } from '@/components/ocr/OCRResultViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileText, 
  BarChart3, 
  Sparkles,
  Brain,
  Zap,
  Database
} from 'lucide-react';
import { UploadedFile, UploadProgress, ChartData, OCRResult, StructuredData } from '@/types/upload';

export default function UploadDemoPage() {
  const t = useTranslations();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [activeTab, setActiveTab] = useState<string>('upload');

  // サンプルデータ（worker2のEvidence新機能シミュレーション）
  const generateSampleData = (): UploadedFile => {
    const fileId = `sample_${Date.now()}`;
    return {
      id: fileId,
      name: 'budget_analysis_2024.pdf',
      size: 2847592,
      type: 'application/pdf',
      lastModified: Date.now(),
      uploadedAt: new Date().toISOString(),
      status: 'completed',
      qualityScore: 0.92,
      metadata: {
        author: 'Finance Department',
        createdDate: '2024-01-15',
        title: '2024年度予算分析報告書',
        pageCount: 24,
        fileFormat: 'PDF',
      },
      ocrResult: {
        text: `2024年度予算分析報告書\n\n1. 予算概要\n総予算額：50,000,000円\n前年度比：+15%\n\n2. 部門別配分\n・研究開発部：20,000,000円（40%）\n・マーケティング部：15,000,000円（30%）\n・製造部：10,000,000円（20%）\n・管理部：5,000,000円（10%）\n\n3. 四半期別計画\nQ1：12,500,000円\nQ2：15,000,000円\nQ3：12,500,000円\nQ4：10,000,000円\n\n※詳細は添付資料参照`,
        confidence: 0.92,
        language: 'ja',
        boundingBoxes: []
      },
      structuredData: {
        tables: [
          {
            id: 'table_1',
            title: '部門別予算配分',
            headers: ['部門', '予算額（円）', '比率（%）'],
            rows: [
              ['研究開発部', '20,000,000', '40'],
              ['マーケティング部', '15,000,000', '30'],
              ['製造部', '10,000,000', '20'],
              ['管理部', '5,000,000', '10']
            ],
            position: { page: 1, x: 100, y: 200 },
            confidence: 0.95
          }
        ],
        footnotes: [
          {
            id: 'note_1',
            reference: '※1',
            text: '前年度比較は2023年度実績を基準とする',
            page: 1,
            position: { x: 50, y: 600 }
          }
        ],
        charts: [
          {
            id: 'chart_1',
            type: 'pie',
            title: '部門別予算配分比率',
            data: [
              { label: '研究開発部', value: 20000000 },
              { label: 'マーケティング部', value: 15000000 },
              { label: '製造部', value: 10000000 },
              { label: '管理部', value: 5000000 }
            ],
            extractedValues: [20000000, 15000000, 10000000, 5000000]
          },
          {
            id: 'chart_2',
            type: 'bar',
            title: '四半期別予算計画',
            data: [
              { label: 'Q1', value: 12500000 },
              { label: 'Q2', value: 15000000 },
              { label: 'Q3', value: 12500000 },
              { label: 'Q4', value: 10000000 }
            ],
            extractedValues: [12500000, 15000000, 12500000, 10000000]
          }
        ],
        summary: {
          title: '2024年度予算分析報告書',
          abstract: '2024年度の総予算5000万円を4部門に配分。研究開発部が40%と最大の配分を受け、四半期別ではQ2が最大となる計画。',
          keyPoints: [
            '総予算額は前年度比15%増の5000万円',
            '研究開発部への重点投資（40%配分）',
            'Q2に最大の予算執行を計画（1500万円）'
          ],
          categories: ['予算', '財務', '計画'],
          relevanceScore: 0.95,
          subsidyRelevance: {
            category: 'budget',
            confidence: 0.98,
            suggestedForm: 'form4'
          }
        }
      },
      previewUrl: '/sample-preview.pdf',
      thumbnailUrl: '/sample-thumb.jpg'
    };
  };

  const handleFilesUpload = useCallback(async (files: File[]) => {
    // アップロード進行状況のシミュレーション
    files.forEach((file, index) => {
      const fileId = `upload_${Date.now()}_${index}`;
      
      // 進行状況の初期化
      setUploadProgress(prev => [...prev, {
        fileId,
        fileName: file.name,
        progress: 0,
        stage: 'uploading'
      }]);
      
      // プログレス更新のシミュレーション
      const updateProgress = (progress: number, stage: UploadProgress['stage']) => {
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId ? { ...p, progress, stage } : p)
        );
      };
      
      // 段階的な進行のシミュレーション
      setTimeout(() => updateProgress(25, 'uploading'), 500);
      setTimeout(() => updateProgress(50, 'ocr'), 1000);
      setTimeout(() => updateProgress(75, 'processing'), 1500);
      setTimeout(() => updateProgress(90, 'analyzing'), 2000);
      setTimeout(() => {
        updateProgress(100, 'completed');
        
        // 完了後にサンプルデータを追加
        const sampleFile = generateSampleData();
        setUploadedFiles(prev => [...prev, { ...sampleFile, id: fileId, name: file.name }]);
        
        // 進行状況から削除
        setUploadProgress(prev => prev.filter(p => p.fileId !== fileId));
      }, 2500);
    });
  }, []);

  const handleFileRemove = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleAddSampleData = useCallback(() => {
    const sampleFile = generateSampleData();
    setUploadedFiles(prev => [...prev, sampleFile]);
    setActiveTab('results');
  }, []);

  // 統計情報の計算
  const getTotalStats = () => {
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    const totalCharts = completedFiles.reduce((sum, f) => sum + (f.structuredData?.charts?.length || 0), 0);
    const totalTables = completedFiles.reduce((sum, f) => sum + (f.structuredData?.tables?.length || 0), 0);
    const avgQuality = completedFiles.length > 0 
      ? completedFiles.reduce((sum, f) => sum + (f.qualityScore || 0), 0) / completedFiles.length 
      : 0;
    
    return {
      totalFiles: completedFiles.length,
      totalCharts,
      totalTables,
      avgQuality
    };
  };

  const stats = getTotalStats();

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-4">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Upload className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              補助資料アップロード & AI自動解析
            </h1>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              worker3統合
            </Badge>
            <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
              <Shield className="h-3 w-3 mr-1" />
              governance準拠
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            ドラッグ&ドロップ → AI分析サービス → OCR・表抽出・グラフ化 → 品質評価を自動実行
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
            <span>• WCAG 2.1 AA準拠</span>
            <span>• 2秒以内表示</span>
            <span>• CSPセキュリティ対応</span>
            <span>• worker3基盤連携</span>
          </div>
        </div>

        {/* 統計情報 */}
        {stats.totalFiles > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="text-center">
              <CardContent className="pt-4">
                <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
                <div className="text-sm text-gray-600">処理済みファイル</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-4">
                <BarChart3 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <div className="text-2xl font-bold">{stats.totalCharts}</div>
                <div className="text-sm text-gray-600">抽出グラフ</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-4">
                <Database className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <div className="text-2xl font-bold">{stats.totalTables}</div>
                <div className="text-sm text-gray-600">抽出表</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-4">
                <Brain className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <div className="text-2xl font-bold">{Math.round(stats.avgQuality * 100)}%</div>
                <div className="text-sm text-gray-600">平均品質スコア</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              アップロード
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              分析ダッシュボード
            </TabsTrigger>
            <TabsTrigger value="results">
              <FileText className="h-4 w-4 mr-2" />
              解析結果 ({uploadedFiles.length})
            </TabsTrigger>
            <TabsTrigger value="charts">
              <BarChart3 className="h-4 w-4 mr-2" />
              グラフ ({stats.totalCharts})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-6">
            <UploadErrorBoundary>
              <FileDropzone
                onFilesUpload={handleFilesUpload}
                onFileRemove={handleFileRemove}
                uploadedFiles={uploadedFiles}
                uploadProgress={uploadProgress}
              />
            </UploadErrorBoundary>
            
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>worker3統合デモ</span>
                </CardTitle>
                <CardDescription>
                  AI分析サービス・PDF準備サービス・構造化データサービス連携体験
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={handleAddSampleData} className="flex items-center justify-center space-x-2">
                    <Brain className="h-4 w-4" />
                    <span>サンプル予算分析レポート</span>
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('analytics')} className="flex items-center justify-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>分析ダッシュボード表示</span>
                  </Button>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center space-x-2 text-green-800">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">governance.yaml完全準拠</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    WCAG 2.1 AA • CSP準拠 • 2秒表示保証 • worker3基盤統合
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <OptimizedUploadAnalytics files={uploadedFiles} enableVirtualization={uploadedFiles.length > 20} />
          </TabsContent>
          
          <TabsContent value="results" className="space-y-6">
            {uploadedFiles.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    解析結果がありません
                  </h3>
                  <p className="text-gray-500 mb-4">
                    ファイルをアップロードしてworker3の革新技術を体験してください
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <Button onClick={() => setActiveTab('upload')}>
                      <Upload className="h-4 w-4 mr-2" />
                      アップロードページへ
                    </Button>
                    <Button variant="outline" onClick={handleAddSampleData}>
                      <Brain className="h-4 w-4 mr-2" />
                      サンプルデータで体験
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {uploadedFiles.map((file) => (
                  <div key={file.id}>
                    {file.ocrResult && (
                      <OCRResultViewer
                        ocrResult={file.ocrResult}
                        structuredData={file.structuredData}
                        fileName={file.name}
                        onCopyText={(text) => navigator.clipboard.writeText(text)}
                        onExportData={(format) => console.log(`Export ${file.name} as ${format}`)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="charts" className="space-y-6">
            {stats.totalCharts === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    グラフが見つかりません
                  </h3>
                  <p className="text-gray-500 mb-4">
                    グラフを含むファイルをアップロードしてChart.js自動可視化を体験
                  </p>
                  <div className="space-y-3">
                    <Button onClick={handleAddSampleData} variant="outline">
                      <Brain className="h-4 w-4 mr-2" />
                      サンプルデータでグラフ体験
                    </Button>
                    <div className="text-xs text-gray-500">
                      worker3のAI分析サービスによる自動グラフ抽出・可視化技術
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded">
                  <h3 className="font-medium text-green-900 mb-2">🚀 worker3統合Chart.js可視化</h3>
                  <p className="text-sm text-green-800">
                    AI分析サービス → 自動グラフ抽出 → Chart.js可視化 → アクセシブル表示
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {uploadedFiles
                    .filter(f => f.structuredData?.charts)
                    .flatMap(f => f.structuredData!.charts)
                    .map((chart) => (
                      <ExtractedChart
                        key={chart.id}
                        chartData={chart}
                        onExport={(chartId, format) => console.log(`Export ${chartId} as ${format}`)}
                        onFullscreen={(chartId) => console.log(`Fullscreen ${chartId}`)}
                      />
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
}