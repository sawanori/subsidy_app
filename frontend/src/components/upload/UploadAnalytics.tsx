'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  BarChart3,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Database,
  Zap
} from 'lucide-react';
import { UploadedFile } from '@/types/upload';

interface UploadAnalyticsProps {
  files: UploadedFile[];
  className?: string;
}

export function UploadAnalytics({ files, className = '' }: UploadAnalyticsProps) {
  // 基本統計
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const totalCharts = files.reduce((sum, f) => sum + (f.structuredData?.charts?.length || 0), 0);
  const totalTables = files.reduce((sum, f) => sum + (f.structuredData?.tables?.length || 0), 0);
  
  // 品質スコア統計
  const qualityScores = files
    .filter(f => f.qualityScore !== undefined)
    .map(f => f.qualityScore!);
  const avgQuality = qualityScores.length > 0 
    ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
    : 0;
  const minQuality = qualityScores.length > 0 ? Math.min(...qualityScores) : 0;
  const maxQuality = qualityScores.length > 0 ? Math.max(...qualityScores) : 0;
  
  // ファイルタイプ分析
  const fileTypeStats = files.reduce((acc, file) => {
    const type = file.type.includes('pdf') ? 'PDF' 
                : file.type.includes('image') ? '画像'
                : file.type.includes('excel') || file.type.includes('csv') ? 'Excel/CSV'
                : 'その他';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // OCR分析
  const ocrStats = files.filter(f => f.ocrResult).length;
  const avgConfidence = files
    .filter(f => f.ocrResult?.confidence !== undefined)
    .reduce((sum, f, _, arr) => sum + f.ocrResult!.confidence / arr.length, 0);
  
  // 処理時間推定（サンプルデータベース）
  const estimatedProcessingTime = files.length * 2.5; // 平均2.5秒/ファイル
  const completionRate = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  
  if (totalFiles === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">ファイルをアップロードすると分析結果が表示されます</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* メインKPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-900">{totalFiles}</div>
            <div className="text-sm text-blue-700">処理ファイル数</div>
          </CardContent>
        </Card>
        
        <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-900">{Math.round(avgQuality * 100)}%</div>
            <div className="text-sm text-green-700">平均品質スコア</div>
          </CardContent>
        </Card>
        
        <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <BarChart3 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-purple-900">{totalCharts}</div>
            <div className="text-sm text-purple-700">抽出グラフ数</div>
          </CardContent>
        </Card>
        
        <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <Database className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-orange-900">{totalTables}</div>
            <div className="text-sm text-orange-700">抽出表数</div>
          </CardContent>
        </Card>
      </div>
      
      {/* 処理進捗 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">処理進捗状況</CardTitle>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {completedFiles}/{totalFiles} 完了
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">全体進捗</span>
                <span className="text-sm text-gray-600">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>予想処理時間: {estimatedProcessingTime.toFixed(1)}秒</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>OCR解析済み: {ocrStats}件</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>完了率: {Math.round(completionRate)}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span>OCR信頼度: {Math.round(avgConfidence * 100)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ファイルタイプ分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ファイルタイプ分布</CardTitle>
          <CardDescription>アップロードされたファイルの種類別統計</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(fileTypeStats).map(([type, count]) => {
              const percentage = (count / totalFiles) * 100;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{type}</span>
                    <span className="text-gray-600">{count}件 ({percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* 品質分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">品質分析（worker2 Evidence技術）</CardTitle>
          <CardDescription>自動品質スコアリングによる解析精度評価</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded border border-green-200">
              <div className="text-2xl font-bold text-green-900 mb-1">
                {Math.round(maxQuality * 100)}%
              </div>
              <div className="text-sm text-green-700">最高品質スコア</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded border border-blue-200">
              <div className="text-2xl font-bold text-blue-900 mb-1">
                {Math.round(avgQuality * 100)}%
              </div>
              <div className="text-sm text-blue-700">平均品質スコア</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded border border-orange-200">
              <div className="text-2xl font-bold text-orange-900 mb-1">
                {Math.round(minQuality * 100)}%
              </div>
              <div className="text-sm text-orange-700">最低品質スコア</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">worker2技術統合ポイント</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 品質スコア90%以上: 高精度自動解析完了</li>
                  <li>• 品質スコア70-89%: 一部手動確認推奨</li>
                  <li>• 品質スコア70%未満: 再スキャンまたは手動処理推奨</li>
                  <li>• worker2のEvidence技術により信頼性評価を自動実行</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}