'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, FileX } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class UploadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.stack || null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Upload Error Boundary caught error:', error, errorInfo);
    
    // ここでerror reportingサービスに送信可能
    // reporter.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // ページリロードではなくstate resetのみ
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle className="text-red-900">アップロード機能でエラーが発生しました</CardTitle>
                <CardDescription className="text-red-700">
                  ファイルのアップロードまたは処理中に問題が発生しました
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-100 border border-red-200 rounded p-3">
                <h4 className="font-medium text-red-900 mb-2">エラー詳細</h4>
                <p className="text-sm text-red-800 mb-2">
                  {this.state.error?.message || '不明なエラーが発生しました'}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="text-xs text-red-700">
                    <summary className="cursor-pointer font-medium">技術詳細 (開発モード)</summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                      {this.state.errorInfo}
                    </pre>
                  </details>
                )}
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="font-medium text-yellow-900 mb-2">推奨対処法</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>ページを再読み込みして再試行してください</li>
                  <li>ファイルサイズが制限内であることを確認してください</li>
                  <li>対応ファイル形式（PDF, Excel, CSV, 画像）であることを確認してください</li>
                  <li>ネットワーク接続を確認してください</li>
                </ul>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button onClick={this.handleRetry} className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>再試行</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Clear localStorage, sessionStorage if needed
                    localStorage.removeItem('upload-cache');
                    sessionStorage.removeItem('upload-temp');
                    window.location.href = window.location.pathname;
                  }}
                >
                  <FileX className="h-4 w-4 mr-2" />
                  リセットして開始
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}