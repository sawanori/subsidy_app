'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Eye, 
  Copy, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  Table,
  FileInput
} from 'lucide-react';
import { OCRResult, StructuredData, TableData, FootnoteData } from '@/types/upload';

interface OCRResultViewerProps {
  ocrResult: OCRResult;
  structuredData?: StructuredData;
  fileName: string;
  className?: string;
  onCopyText?: (text: string) => void;
  onExportData?: (format: 'txt' | 'json' | 'csv') => void;
}

export function OCRResultViewer({
  ocrResult,
  structuredData,
  fileName,
  className = '',
  onCopyText,
  onExportData
}: OCRResultViewerProps) {
  const t = useTranslations();
  const [selectedText, setSelectedText] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 信頼度による色分け
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return '高精度';
    if (confidence >= 0.7) return '中精度';
    return '要確認';
  };

  // テキストのハイライト表示
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  // 統計情報の計算
  const getTextStats = () => {
    const text = ocrResult.text;
    return {
      characters: text.length,
      words: text.split(/\s+/).filter(Boolean).length,
      lines: text.split('\n').length,
      paragraphs: text.split(/\n\s*\n/).filter(Boolean).length,
    };
  };

  const stats = getTextStats();

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg">OCR解析結果</CardTitle>
                <CardDescription>{fileName}</CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={getConfidenceColor(ocrResult.confidence)}>
                {getConfidenceLabel(ocrResult.confidence)} 
                ({Math.round(ocrResult.confidence * 100)}%)
              </Badge>
              
              <Badge variant="outline">
                {ocrResult.language || 'ja'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text">テキスト</TabsTrigger>
              <TabsTrigger value="structured">構造化データ</TabsTrigger>
              <TabsTrigger value="tables">表データ</TabsTrigger>
              <TabsTrigger value="stats">統計情報</TabsTrigger>
            </TabsList>
            
            {/* テキストタブ */}
            <TabsContent value="text" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="テキスト検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onCopyText?.(ocrResult.text)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    コピー
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onExportData?.('txt')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    TXT
                  </Button>
                </div>
              </div>
              
              <div className="border border-gray-300 rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <pre 
                  className="whitespace-pre-wrap text-sm font-mono leading-relaxed"
                  onMouseUp={() => {
                    const selection = window.getSelection()?.toString();
                    if (selection) setSelectedText(selection);
                  }}
                  dangerouslySetInnerHTML={{
                    __html: highlightText(ocrResult.text, searchTerm)
                  }}
                />
              </div>
              
              {selectedText && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="font-medium text-blue-900 mb-2">選択テキスト</h4>
                  <p className="text-sm text-blue-800 mb-2">{selectedText}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onCopyText?.(selectedText)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    選択部分をコピー
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* 構造化データタブ */}
            <TabsContent value="structured" className="space-y-4">
              {structuredData ? (
                <div className="space-y-6">
                  {/* 要約情報 */}
                  {structuredData.summary && (
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader>
                        <CardTitle className="text-green-900 text-base">
                          文書要約
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-green-800">タイトル</h4>
                            <p className="text-green-700">{structuredData.summary.title}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800">概要</h4>
                            <p className="text-green-700">{structuredData.summary.abstract}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800">キーポイント</h4>
                            <ul className="list-disc list-inside space-y-1 text-green-700">
                              {structuredData.summary.keyPoints.map((point, index) => (
                                <li key={index}>{point}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge className="bg-green-100 text-green-800">
                              関連度: {Math.round(structuredData.summary.relevanceScore * 100)}%
                            </Badge>
                            {structuredData.summary.subsidyRelevance && (
                              <Badge className="bg-blue-100 text-blue-800">
                                {structuredData.summary.subsidyRelevance.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* 脚注 */}
                  {structuredData.footnotes.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">脚注・注釈 ({structuredData.footnotes.length}個)</h3>
                      <div className="space-y-2">
                        {structuredData.footnotes.map((footnote) => (
                          <div key={footnote.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <Badge variant="outline" className="text-xs">
                                {footnote.reference}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm">{footnote.text}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  ページ{footnote.page} • 位置({footnote.position.x}, {footnote.position.y})
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileInput className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>構造化データが利用できません</p>
                  <p className="text-sm">高度な解析機能はworker2の処理完了をお待ちください</p>
                </div>
              )}
            </TabsContent>
            
            {/* 表データタブ */}
            <TabsContent value="tables" className="space-y-4">
              {structuredData?.tables && structuredData.tables.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      検出された表 ({structuredData.tables.length}個)
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onExportData?.('csv')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      CSV出力
                    </Button>
                  </div>
                  
                  {structuredData.tables.map((table, index) => (
                    <Card key={table.id} className="border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {table.title || `表 ${index + 1}`}
                          </CardTitle>
                          <Badge className={getConfidenceColor(table.confidence)}>
                            信頼度 {Math.round(table.confidence * 100)}%
                          </Badge>
                        </div>
                        <CardDescription>
                          {table.headers.length}列 × {table.rows.length}行 • 
                          ページ{table.position.page}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                {table.headers.map((header, i) => (
                                  <th 
                                    key={i} 
                                    className="border border-gray-300 px-3 py-2 text-left font-medium"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.rows.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  {row.map((cell, j) => (
                                    <td 
                                      key={j} 
                                      className="border border-gray-300 px-3 py-2"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>表データが検出されませんでした</p>
                  <p className="text-sm">または解析処理中です</p>
                </div>
              )}
            </TabsContent>
            
            {/* 統計情報タブ */}
            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">{stats.characters.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">文字数</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{stats.words.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">単語数</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">{stats.lines.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">行数</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">{stats.paragraphs.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">段落数</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">OCR処理詳細</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">検出言語:</span>
                      <span className="font-semibold ml-2">{ocrResult.language || '日本語'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">全体信頼度:</span>
                      <span className="font-semibold ml-2">{Math.round(ocrResult.confidence * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">境界ボックス:</span>
                      <span className="font-semibold ml-2">
                        {ocrResult.boundingBoxes?.length || 0}個
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">処理状態:</span>
                      <Badge variant="outline" className="ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        完了
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">品質向上のヒント</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• スキャン解像度を300dpi以上にすると精度が向上します</li>
                        <li>• 文字がぼやけている場合は再スキャンを推奨します</li>
                        <li>• 手書き文字は認識精度が低くなる場合があります</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}