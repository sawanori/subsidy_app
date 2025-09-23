'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  AlertCircle, 
  CheckCircle2,
  X,
  Eye,
  Download,
  BarChart3
} from 'lucide-react';
import { UploadedFile, UploadConfig, UploadProgress } from '@/types/upload';
import { formatBytes } from '@/lib/utils';

interface FileDropzoneProps {
  onFilesUpload: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  uploadedFiles: UploadedFile[];
  uploadProgress: UploadProgress[];
  config?: Partial<UploadConfig>;
  className?: string;
}

const defaultConfig: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ],
  enableOCR: true,
  enableAutoSummary: true,
  enableChartExtraction: true,
};

export function FileDropzone({
  onFilesUpload,
  onFileRemove,
  uploadedFiles,
  uploadProgress,
  config = {},
  className = ''
}: FileDropzoneProps) {
  const t = useTranslations();
  const [dragError, setDragError] = useState<string | null>(null);
  
  const finalConfig = { ...defaultConfig, ...config };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError(null);
    
    // バリデーション
    if (uploadedFiles.length + acceptedFiles.length > finalConfig.maxFiles) {
      setDragError(`最大${finalConfig.maxFiles}ファイルまでアップロード可能です`);
      return;
    }
    
    const oversizedFiles = acceptedFiles.filter(file => file.size > finalConfig.maxFileSize);
    if (oversizedFiles.length > 0) {
      setDragError(`ファイルサイズが大きすぎます (最大: ${formatBytes(finalConfig.maxFileSize)})`);
      return;
    }
    
    if (rejectedFiles.length > 0) {
      setDragError('サポートされていないファイル形式が含まれています');
      return;
    }
    
    onFilesUpload(acceptedFiles);
  }, [uploadedFiles.length, finalConfig, onFilesUpload]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: finalConfig.allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: finalConfig.maxFiles - uploadedFiles.length,
    maxSize: finalConfig.maxFileSize,
  });

  const getFileIcon = (file: UploadedFile) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'uploading': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ドロップゾーン */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
              ${isDragAccept ? 'border-green-500 bg-green-50' : ''}
              ${isDragReject ? 'border-red-500 bg-red-50' : ''}
              hover:border-primary hover:bg-primary/5
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              <Upload 
                className={`h-12 w-12 ${
                  isDragActive ? 'text-primary' : 'text-gray-400'
                }`} 
              />
              
              <div>
                <p className="text-lg font-medium">
                  {isDragActive 
                    ? 'ファイルをドロップしてください' 
                    : 'ファイルをドラッグ＆ドロップ'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  または <Button variant="link" className="p-0 h-auto">クリックしてファイルを選択</Button>
                </p>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>対応形式: PDF, Excel, CSV, 画像 (JPEG, PNG, GIF)</p>
                <p>最大ファイルサイズ: {formatBytes(finalConfig.maxFileSize)}</p>
                <p>最大ファイル数: {finalConfig.maxFiles}個</p>
              </div>
            </div>
          </div>
          
          {dragError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-sm">{dragError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* アップロード進行状況 */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">アップロード進行状況</h3>
            <div className="space-y-3">
              {uploadProgress.map((progress) => (
                <div key={progress.fileId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{progress.fileName}</span>
                    <span className="text-gray-500">{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>状態: {progress.stage}</span>
                    {progress.error && (
                      <span className="text-red-600">{progress.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* アップロード済みファイル一覧 */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">
              アップロード済みファイル ({uploadedFiles.length}/{finalConfig.maxFiles})
            </h3>
            
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(file)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{formatBytes(file.size)}</span>
                        <span>{new Date(file.uploadedAt).toLocaleString('ja-JP')}</span>
                        
                        {file.qualityScore && (
                          <Badge variant="outline" className="text-xs">
                            品質: {Math.round(file.qualityScore * 100)}%
                          </Badge>
                        )}
                        
                        {file.ocrResult && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            OCR済み
                          </Badge>
                        )}
                        
                        {file.structuredData?.charts && file.structuredData.charts.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            グラフ{file.structuredData.charts.length}個
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(file.status)}>
                      {file.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {file.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {file.status === 'completed' ? '完了' : 
                       file.status === 'processing' ? '処理中' : 
                       file.status === 'uploading' ? 'アップロード中' : 'エラー'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {file.previewUrl && (
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onFileRemove(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 技術機能説明 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">🚀 高度な自動処理機能</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>OCR文字認識・テキスト抽出</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>グラフ・表の自動検出・データ化</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>品質スコア・構造化分析</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}