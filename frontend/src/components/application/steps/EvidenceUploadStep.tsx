'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Image,
  FileSpreadsheet
} from 'lucide-react';

interface EvidenceUploadStepProps {
  data: {
    files: File[];
    processedDocuments: any[];
  };
  onComplete: (data: any) => void;
}

interface UploadedFile {
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  ocrResult?: any;
  error?: string;
}

const FILE_TYPES = {
  'application/pdf': { icon: FileText, color: 'text-red-500' },
  'image/jpeg': { icon: Image, color: 'text-blue-500' },
  'image/png': { icon: Image, color: 'text-blue-500' },
  'application/vnd.ms-excel': { icon: FileSpreadsheet, color: 'text-green-500' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileSpreadsheet, color: 'text-green-500' },
};

export function EvidenceUploadStep({ data, onComplete }: EvidenceUploadStepProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      status: 'uploading' as const,
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate file upload and processing
    newFiles.forEach((uploadedFile, index) => {
      simulateFileProcessing(uploadedFile, index);
    });
  }, []);

  const simulateFileProcessing = (uploadedFile: UploadedFile, index: number) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadedFiles(prev => {
        const updated = [...prev];
        const fileIndex = prev.findIndex(f => f.file === uploadedFile.file);
        if (fileIndex !== -1 && updated[fileIndex].progress < 100) {
          updated[fileIndex].progress += 20;
          if (updated[fileIndex].progress >= 100) {
            updated[fileIndex].status = 'processing';
            clearInterval(uploadInterval);
            // Start OCR processing
            setTimeout(() => {
              setUploadedFiles(prev => {
                const processed = [...prev];
                processed[fileIndex].status = 'completed';
                processed[fileIndex].ocrResult = {
                  text: `OCR結果: ${uploadedFile.file.name}から抽出されたテキスト`,
                  confidence: 0.95,
                };
                return processed;
              });
            }, 2000);
          }
        }
        return updated;
      });
    }, 500);
  };

  const removeFile = (file: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleComplete = () => {
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    onComplete({
      files: completedFiles.map(f => f.file),
      processedDocuments: completedFiles.map(f => f.ocrResult),
    });
  };

  const allFilesProcessed = uploadedFiles.length > 0 && 
    uploadedFiles.every(f => f.status === 'completed' || f.status === 'error');

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          見積書、事業計画書、決算書などの証拠書類をアップロードしてください。
          対応形式：PDF、画像（JPG/PNG）、Excel
        </AlertDescription>
      </Alert>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'}
          hover:border-primary hover:bg-primary/5
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? 'ファイルをドロップ' : 'ファイルをドラッグ&ドロップ'}
        </p>
        <p className="text-sm text-gray-500">
          またはクリックしてファイルを選択
        </p>
        <p className="text-xs text-gray-400 mt-2">
          最大10MB / PDF, JPG, PNG, Excel形式
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>アップロードファイル</CardTitle>
            <CardDescription>
              {uploadedFiles.filter(f => f.status === 'completed').length} / {uploadedFiles.length} ファイル処理完了
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadedFiles.map((uploadedFile, index) => {
              const fileType = FILE_TYPES[uploadedFile.file.type as keyof typeof FILE_TYPES] || 
                { icon: FileText, color: 'text-gray-500' };
              const Icon = fileType.icon;

              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <Icon className={`h-8 w-8 ${fileType.color}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{uploadedFile.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.file.size / 1024).toFixed(1)} KB
                      </p>
                      {uploadedFile.status === 'uploading' && (
                        <Progress value={uploadedFile.progress} className="h-1 mt-2" />
                      )}
                      {uploadedFile.status === 'processing' && (
                        <p className="text-xs text-blue-600 mt-1">OCR処理中...</p>
                      )}
                      {uploadedFile.status === 'completed' && uploadedFile.ocrResult && (
                        <p className="text-xs text-green-600 mt-1">
                          処理完了（信頼度: {(uploadedFile.ocrResult.confidence * 100).toFixed(0)}%）
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadedFile.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadedFile.file)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleComplete}
          disabled={!allFilesProcessed || uploadedFiles.length === 0}
        >
          次へ進む
        </Button>
      </div>
    </div>
  );
}