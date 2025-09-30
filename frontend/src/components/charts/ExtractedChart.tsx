'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Download, 
  Maximize2,
  RefreshCw 
} from 'lucide-react';
import { ChartData, ChartDisplayData } from '@/types/upload';

// Chart.js登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ExtractedChartProps {
  chartData: ChartData;
  displayMode?: 'auto' | 'bar' | 'line' | 'pie';
  className?: string;
  onExport?: (chartId: string, format: 'png' | 'pdf') => void;
  onFullscreen?: (chartId: string) => void;
}

export function ExtractedChart({
  chartData,
  displayMode = 'auto',
  className = '',
  onExport,
  onFullscreen
}: ExtractedChartProps) {
  
  // Chart.js用データ変換
  const chartDisplayData = useMemo((): ChartDisplayData => {
    const finalType = displayMode === 'auto' ? chartData.type : displayMode;
    
    // 色パレット（アクセシビリティ配慮）
    const colors = [
      '#3b82f6', // blue-500
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6', // violet-500
      '#06b6d4', // cyan-500
      '#84cc16', // lime-500
      '#f97316', // orange-500
    ];
    
    const backgroundColors = colors.map(color => `${color}20`); // 透明度20%
    const borderColors = colors;
    
    return {
      id: chartData.id,
      title: chartData.title || 'グラフ',
      type: finalType === 'scatter' ? 'line' : (finalType === 'unknown' ? 'bar' : finalType) as any,
      data: {
        labels: chartData.labels || chartData.data.map(d => d.label),
        datasets: [{
          label: chartData.title || 'データ',
          data: chartData.extractedValues || chartData.data.map(d => d.value),
          backgroundColor: (finalType === 'pie' || finalType === 'unknown' ? backgroundColors : backgroundColors[0]) as any,
          borderColor: (finalType === 'pie' || finalType === 'unknown' ? borderColors : borderColors[0]) as any,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: !!chartData.title,
            text: chartData.title,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
          }
        },
        scales: finalType === 'pie' ? undefined : {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            }
          }
        },
        accessibility: {
          enabled: true,
          description: `${chartData.title || 'グラフ'} - ${chartData.data.length}個のデータポイント`
        }
      }
    };
  }, [chartData, displayMode]);

  const renderChart = () => {
    const commonProps = {
      data: chartDisplayData.data,
      options: chartDisplayData.options as ChartOptions<any>,
      height: 300
    };

    switch (chartDisplayData.type) {
      case 'bar':
        return <Bar {...commonProps} />;
      case 'line':
        return <Line {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      default:
        return <Bar {...commonProps} />;
    }
  };

  const getChartIcon = () => {
    switch (chartDisplayData.type) {
      case 'bar': return <BarChart3 className="h-4 w-4" />;
      case 'line': return <LineChart className="h-4 w-4" />;
      case 'pie':
      case 'doughnut': return <PieChart className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (chartDisplayData.type) {
      case 'bar': return '棒グラフ';
      case 'line': return '折れ線グラフ';
      case 'pie': return '円グラフ';
      case 'doughnut': return 'ドーナツグラフ';
      default: return 'グラフ';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getChartIcon()}
            <div>
              <CardTitle className="text-lg">
                {chartDisplayData.title}
              </CardTitle>
              <CardDescription>
                {getTypeLabel()} • {chartData.data.length}個のデータポイント
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              自動抽出
            </Badge>
            
            {chartData.type !== displayMode && displayMode !== 'auto' && (
              <Badge variant="secondary" className="text-xs">
                {displayMode}形式で表示
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* グラフ表示エリア */}
        <div className="h-80 mb-4">
          {renderChart()}
        </div>
        
        {/* データ詳細 */}
        <div className="space-y-4">
          {/* 抽出データサマリー */}
          <div className="bg-gray-50 p-3 rounded border">
            <h4 className="font-medium text-sm mb-2">抽出データサマリー</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-600">データ点数:</span>
                <span className="font-semibold ml-1">{chartData.data.length}</span>
              </div>
              <div>
                <span className="text-gray-600">最大値:</span>
                <span className="font-semibold ml-1">
                  {Math.max(...chartData.data.map(d => d.value)).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">最小値:</span>
                <span className="font-semibold ml-1">
                  {Math.min(...chartData.data.map(d => d.value)).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">合計:</span>
                <span className="font-semibold ml-1">
                  {chartData.data.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* 生データテーブル */}
          <div className="border rounded overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b">
              <h4 className="font-medium text-sm">抽出データ詳細</h4>
            </div>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 border-b">項目</th>
                    <th className="text-right p-2 border-b">値</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-2 border-b">{item.label}</td>
                      <td className="p-2 border-b text-right font-mono">
                        {item.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* アクション */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-xs text-gray-500">
            自動抽出 • Chart.js表示 • アクセシブル対応
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExport?.(chartData.id, 'png')}
            >
              <Download className="h-4 w-4 mr-1" />
              PNG
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onFullscreen?.(chartData.id)}
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              拡大
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              更新
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}