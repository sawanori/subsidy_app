'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Calculator,
  Gauge,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

/**
 * コスト警告コンポーネント
 * APP-424: コスト超過/レート超過の警告UI
 */

interface CostEstimate {
  estimatedCost: number;
  actualCost: number;
  limit: number;
  currency: string;
  breakdown: CostBreakdown[];
  warnings: CostWarning[];
  rateLimit?: RateLimit;
}

interface CostBreakdown {
  category: string;
  description: string;
  amount: number;
  units?: number;
  unitPrice?: number;
  percentage?: number;
}

interface CostWarning {
  type: 'cost_exceed' | 'rate_limit' | 'budget_alert' | 'usage_spike';
  severity: 'high' | 'medium' | 'low';
  message: string;
  threshold?: number;
  current?: number;
  recommendation?: string;
}

interface RateLimit {
  requestsPerMinute: number;
  currentRate: number;
  remaining: number;
  resetTime: string;
}

interface CostWarningProps {
  applicationId?: string;
  showDetails?: boolean;
  autoCheck?: boolean;
  onProceed?: () => void;
  onCancel?: () => void;
}

export function CostWarning({
  applicationId,
  showDetails = true,
  autoCheck = true,
  onProceed,
  onCancel,
}: CostWarningProps) {
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [agreedToCharges, setAgreedToCharges] = useState(false);

  /**
   * コスト見積もり取得
   */
  const fetchCostEstimate = async () => {
    if (!applicationId) return;

    setIsLoading(true);
    try {
      const response = await apiClient.get(`/applications/${applicationId}/cost-estimate`);
      setCostEstimate(response);

      // 警告がある場合は確認ダイアログを表示
      if (response.warnings?.some((w: CostWarning) => w.severity === 'high')) {
        setShowConfirmDialog(true);
      }
    } catch (error) {
      console.error('Failed to fetch cost estimate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 初回チェック
   */
  useEffect(() => {
    if (autoCheck && applicationId) {
      fetchCostEstimate();
    }
  }, [applicationId, autoCheck]);

  /**
   * コスト超過率計算
   */
  const getExceedPercentage = (): number => {
    if (!costEstimate) return 0;
    return Math.round((costEstimate.estimatedCost / costEstimate.limit) * 100);
  };

  /**
   * 警告レベル取得
   */
  const getWarningLevel = (): 'danger' | 'warning' | 'safe' => {
    const percentage = getExceedPercentage();
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'safe';
  };

  /**
   * 警告色取得
   */
  const getWarningColor = () => {
    const level = getWarningLevel();
    switch (level) {
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  /**
   * 処理続行
   */
  const handleProceed = () => {
    if (!agreedToCharges && getWarningLevel() === 'danger') {
      setShowConfirmDialog(true);
      return;
    }
    onProceed?.();
    setShowConfirmDialog(false);
  };

  /**
   * デフォルトコスト見積もり（デモ用）
   */
  const defaultEstimate: CostEstimate = {
    estimatedCost: 12.5,
    actualCost: 8.3,
    limit: 15.0,
    currency: '円',
    breakdown: [
      {
        category: 'AI生成',
        description: 'GPT-4による文書生成',
        amount: 8.0,
        units: 4,
        unitPrice: 2.0,
        percentage: 64,
      },
      {
        category: 'OCR処理',
        description: 'エビデンス文字認識',
        amount: 2.5,
        units: 10,
        unitPrice: 0.25,
        percentage: 20,
      },
      {
        category: 'PDF生成',
        description: 'PDF変換・最適化',
        amount: 1.5,
        units: 1,
        unitPrice: 1.5,
        percentage: 12,
      },
      {
        category: 'ストレージ',
        description: 'ファイル保存',
        amount: 0.5,
        units: 100,
        unitPrice: 0.005,
        percentage: 4,
      },
    ],
    warnings: [
      {
        type: 'budget_alert',
        severity: 'medium',
        message: '今月の利用額が予算の80%に達しています',
        threshold: 80,
        current: 83,
        recommendation: '不要な処理を避けるか、来月まで待つことをお勧めします',
      },
    ],
    rateLimit: {
      requestsPerMinute: 60,
      currentRate: 45,
      remaining: 15,
      resetTime: new Date(Date.now() + 60000).toISOString(),
    },
  };

  const estimate = costEstimate || defaultEstimate;
  const exceedPercentage = getExceedPercentage();
  const warningLevel = getWarningLevel();

  if (!showDetails) {
    // シンプル表示
    return (
      <>
        {warningLevel !== 'safe' && (
          <Alert variant={warningLevel === 'danger' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              推定コスト: {estimate.currency}{estimate.estimatedCost.toFixed(2)}
              （上限の{exceedPercentage}%）
            </AlertDescription>
          </Alert>
        )}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                コスト見積もり
              </CardTitle>
              <CardDescription>
                処理にかかる推定コストと利用状況
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCostEstimate}
              disabled={isLoading}
            >
              <Calculator className="h-4 w-4 mr-1" />
              再計算
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* コストサマリー */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">推定コスト</p>
              <p className={`text-2xl font-bold ${getWarningColor()}`}>
                {estimate.currency}{estimate.estimatedCost.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">実績コスト</p>
              <p className="text-2xl font-bold">
                {estimate.currency}{estimate.actualCost.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">利用上限</p>
              <p className="text-2xl font-bold">
                {estimate.currency}{estimate.limit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* 使用率バー */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">使用率</span>
              <Badge variant={warningLevel === 'danger' ? 'destructive' : warningLevel === 'warning' ? 'secondary' : 'default'}>
                {exceedPercentage}%
              </Badge>
            </div>
            <Progress
              value={exceedPercentage}
              className={`h-3 ${
                warningLevel === 'danger' ? 'bg-red-100' :
                warningLevel === 'warning' ? 'bg-yellow-100' : ''
              }`}
            />
          </div>

          {/* 警告 */}
          {estimate.warnings && estimate.warnings.length > 0 && (
            <div className="space-y-2">
              {estimate.warnings.map((warning, index) => (
                <Alert
                  key={index}
                  variant={warning.severity === 'high' ? 'destructive' : 'default'}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{warning.message}</AlertTitle>
                  {warning.recommendation && (
                    <AlertDescription className="mt-2">
                      {warning.recommendation}
                    </AlertDescription>
                  )}
                </Alert>
              ))}
            </div>
          )}

          <Separator />

          {/* コスト内訳 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">コスト内訳</h4>
            {estimate.breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">{item.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                      {item.units && ` (${item.units}単位 × ${estimate.currency}${item.unitPrice})`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {estimate.currency}{item.amount.toFixed(2)}
                  </p>
                  {item.percentage && (
                    <p className="text-xs text-muted-foreground">
                      {item.percentage}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* レート制限 */}
          {estimate.rateLimit && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                レート制限
              </h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  API使用率: {estimate.rateLimit.currentRate}/{estimate.rateLimit.requestsPerMinute} req/min
                </span>
                <Badge variant={estimate.rateLimit.remaining < 10 ? 'destructive' : 'outline'}>
                  残り {estimate.rateLimit.remaining}
                </Badge>
              </div>
              <Progress
                value={(estimate.rateLimit.currentRate / estimate.rateLimit.requestsPerMinute) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                リセット: {new Date(estimate.rateLimit.resetTime).toLocaleTimeString('ja-JP')}
              </p>
            </div>
          )}

          {/* アクション */}
          {warningLevel !== 'safe' && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>処理を続行するとコストが発生します</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onCancel}>
                  キャンセル
                </Button>
                <Button
                  variant={warningLevel === 'danger' ? 'destructive' : 'default'}
                  onClick={handleProceed}
                >
                  続行
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 確認ダイアログ */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              コスト超過警告
            </DialogTitle>
            <DialogDescription>
              推定コストが利用上限を超えています
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                このまま処理を続行すると、{estimate.currency}
                {(estimate.estimatedCost - estimate.limit).toFixed(2)}
                の追加料金が発生する可能性があります。
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <p className="text-sm">以下の方法でコストを削減できます：</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>不要なエビデンスを削除する</li>
                <li>処理する文書数を減らす</li>
                <li>低精度モードを使用する</li>
              </ul>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={agreedToCharges}
                onChange={(e) => setAgreedToCharges(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">
                追加料金が発生することを理解しました
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleProceed}
              disabled={!agreedToCharges}
            >
              続行する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}