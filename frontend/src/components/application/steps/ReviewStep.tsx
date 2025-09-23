'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Target,
  Files
} from 'lucide-react';
import { ApplicationData } from '../ApplicationWizard';

interface ReviewStepProps {
  data: ApplicationData;
  onComplete: (data: any) => void;
}

export function ReviewStep({ data, onComplete }: ReviewStepProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onComplete(data);
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const subsidyRate = data.businessPlan.totalProjectCost > 0 
    ? (data.businessPlan.requestedAmount / data.businessPlan.totalProjectCost * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          以下の内容で申請書類を生成します。内容を確認の上、間違いがなければ「申請書類を生成」ボタンをクリックしてください。
        </AlertDescription>
      </Alert>

      {/* Basic Info Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500">会社名</Label>
              <p className="font-medium">{data.basicInfo.companyName}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">代表者名</Label>
              <p className="font-medium">{data.basicInfo.representativeName}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">住所</Label>
              <p className="font-medium">〒{data.basicInfo.postalCode} {data.basicInfo.address}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">電話番号</Label>
              <p className="font-medium">{data.basicInfo.phone}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">メールアドレス</Label>
              <p className="font-medium">{data.basicInfo.email}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">従業員数</Label>
              <p className="font-medium">{data.basicInfo.employeeCount}名</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Plan Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            事業計画
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-500">補助事業名</Label>
            <p className="font-medium">{data.businessPlan.projectTitle}</p>
          </div>
          
          <div>
            <Label className="text-sm text-gray-500">事業内容</Label>
            <p className="text-sm leading-relaxed">{data.businessPlan.projectDescription}</p>
          </div>

          <Separator />

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-gray-500 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                補助金申請額
              </Label>
              <p className="font-medium text-lg">{formatCurrency(data.businessPlan.requestedAmount)}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">総事業費</Label>
              <p className="font-medium text-lg">{formatCurrency(data.businessPlan.totalProjectCost)}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">補助率</Label>
              <p className="font-medium text-lg">{subsidyRate}%</p>
              <Badge variant={parseFloat(subsidyRate) <= 66.7 ? 'default' : 'destructive'} className="mt-1">
                {parseFloat(subsidyRate) <= 66.7 ? '適正範囲内' : '要確認'}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                事業実施期間
              </Label>
              <p className="font-medium">
                {data.businessPlan.implementationPeriod.start} 〜 {data.businessPlan.implementationPeriod.end}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 flex items-center gap-1">
                <Target className="h-3 w-3" />
                売上目標（3年間）
              </Label>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">1年目: {data.businessPlan.salesTarget.year1}万円</Badge>
                <Badge variant="outline">2年目: {data.businessPlan.salesTarget.year2}万円</Badge>
                <Badge variant="outline">3年目: {data.businessPlan.salesTarget.year3}万円</Badge>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm text-gray-500">期待される効果</Label>
            <p className="text-sm leading-relaxed">{data.businessPlan.expectedEffects}</p>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Files Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            証拠書類
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.evidence.files.length > 0 ? (
            <div className="space-y-2">
              {data.evidence.files.map((file, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{file.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">証拠書類はアップロードされていません</p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>最終確認</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="confirm"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="confirm" className="cursor-pointer">
                入力内容に間違いがないことを確認しました
              </Label>
              <p className="text-sm text-gray-500">
                生成される申請書類は、入力内容に基づいて自動生成されます。
                生成後も内容の修正は可能です。
              </p>
            </div>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            disabled={!isConfirmed || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>処理中...</>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                申請書類を生成
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}