'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  onUpload?: (file: File) => Promise<void>;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

interface FileStatus {
  file: File;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function FileDropZone({
  onFileSelect,
  onUpload,
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
  },
  maxSize = 50 * 1024 * 1024, // 50MB
  className,
  disabled = false,
}: FileDropZoneProps) {
  const [fileStatus, setFileStatus] = useState<FileStatus | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        let errorMessage = 'ファイルのアップロードに失敗しました';

        if (error.code === 'file-too-large') {
          errorMessage = `ファイルサイズが大きすぎます（最大${Math.round(
            maxSize / 1024 / 1024
          )}MB）`;
        } else if (error.code === 'file-invalid-type') {
          errorMessage = 'サポートされていないファイル形式です';
        } else {
          // より詳細なエラー情報を表示
          errorMessage = `ファイル読み込みエラー: ${error.message || error.code || 'Unknown error'}`;
        }

        console.error('File rejected:', error);

        setFileStatus({
          file: rejectedFiles[0].file,
          status: 'error',
          progress: 0,
          error: errorMessage,
        });
        return;
      }

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // ファイル情報をログに記録
      console.log('File accepted:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      onFileSelect(file);

      setFileStatus({
        file,
        status: 'idle',
        progress: 0,
      });

      if (onUpload) {
        setFileStatus((prev) => prev && { ...prev, status: 'uploading', progress: 10 });

        try {
          // プログレスをシミュレート（実際はアップロード進捗をトラッキング）
          const progressInterval = setInterval(() => {
            setFileStatus((prev) => {
              if (!prev || prev.progress >= 90) return prev;
              return { ...prev, progress: prev.progress + 10 };
            });
          }, 200);

          await onUpload(file);

          clearInterval(progressInterval);
          setFileStatus((prev) => prev && { ...prev, status: 'success', progress: 100 });
        } catch (error) {
          setFileStatus((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'error',
                  progress: 0,
                  error: error instanceof Error ? error.message : 'アップロードに失敗しました',
                }
              : null
          );
        }
      }
    },
    [onFileSelect, onUpload, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: (files) => {
      setIsDragging(false);
      // ドロップが拒否された際のログ
      console.error('Files rejected on drop:', files);
    },
    onFileDialogCancel: () => {
      console.log('File dialog cancelled');
    },
    onError: (error) => {
      console.error('Dropzone error:', error);
      setFileStatus({
        file: new File([], 'error'),
        status: 'error',
        progress: 0,
        error: `ファイル選択エラー: ${error.message || error}`,
      });
    },
  });

  const removeFile = () => {
    setFileStatus(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {!fileStatus && (
        <div
          {...getRootProps()}
          className={cn(
            'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all',
            isDragActive || isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive
                  ? 'ファイルをドロップしてください'
                  : 'ファイルをドラッグ&ドロップ'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                または
                <Button variant="link" className="px-1" asChild>
                  <span>クリックして選択</span>
                </Button>
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>対応形式: PDF、PNG、JPG、JPEG、TIFF</p>
              <p>最大ファイルサイズ: {Math.round(maxSize / 1024 / 1024)}MB</p>
            </div>
          </div>
        </div>
      )}

      {fileStatus && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {fileStatus.status === 'uploading' && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {fileStatus.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-status-success" />
              )}
              {fileStatus.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-status-error" />
              )}
              {fileStatus.status === 'idle' && <FileText className="h-5 w-5 text-primary" />}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{fileStatus.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(fileStatus.file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={fileStatus.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {fileStatus.status === 'uploading' && (
                <div className="space-y-1">
                  <Progress value={fileStatus.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    アップロード中... {fileStatus.progress}%
                  </p>
                </div>
              )}

              {fileStatus.status === 'error' && fileStatus.error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">{fileStatus.error}</AlertDescription>
                </Alert>
              )}

              {fileStatus.status === 'success' && (
                <p className="text-sm text-status-success">アップロード完了</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 複数ファイル対応版
export function MultiFileDropZone({
  onFilesSelect,
  onUpload,
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
  },
  maxSize = 50 * 1024 * 1024,
  maxFiles = 10,
  className,
  disabled = false,
}: {
  onFilesSelect: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}) {
  const [files, setFiles] = useState<FileStatus[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        // エラー処理
        return;
      }

      const newFiles: FileStatus[] = acceptedFiles.map((file) => ({
        file,
        status: 'idle' as const,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
      onFilesSelect(acceptedFiles);

      if (onUpload) {
        // アップロード処理
        await onUpload(acceptedFiles);
      }
    },
    [files, maxFiles, onFilesSelect, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: true,
    disabled: disabled || files.length >= maxFiles,
  });

  return (
    <div className={cn('space-y-4', className)}>
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm">
            {isDragActive ? 'ファイルをドロップ' : 'ファイルを選択またはドラッグ'}
          </p>
          <p className="text-xs text-muted-foreground">
            {files.length} / {maxFiles} ファイル
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileStatus, index) => (
            <div key={index} className="flex items-center gap-2 rounded border p-2">
              <FileText className="h-4 w-4" />
              <span className="flex-1 text-sm truncate">{fileStatus.file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}