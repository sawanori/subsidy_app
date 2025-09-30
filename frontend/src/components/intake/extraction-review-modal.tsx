'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ExtractResponse } from '@/lib/api/types';
import {
  Check,
  X,
  AlertCircle,
  Edit2,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface ExtractionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractionData: ExtractResponse;
  onConfirm: (reviewedData: Record<string, any>) => void;
}

interface FieldReview {
  key: string;
  label: string;
  originalValue: any;
  editedValue: any;
  confidence: number;
  isEdited: boolean;
  isConfirmed: boolean;
}

export function ExtractionReviewModal({
  isOpen,
  onClose,
  extractionData,
  onConfirm,
}: ExtractionReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'preview'>('review');
  const [fields, setFields] = useState<FieldReview[]>(() => {
    return Object.entries(extractionData.extracted_fields).map(([key, value]) => ({
      key,
      label: formatFieldLabel(key),
      originalValue: value,
      editedValue: value,
      confidence: extractionData.confidence_scores[key] || 0,
      isEdited: false,
      isConfirmed: extractionData.confidence_scores[key] >= 0.9,
    }));
  });

  const [editingField, setEditingField] = useState<string | null>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-confidence-high';
    if (confidence >= 0.7) return 'text-confidence-medium';
    return 'text-confidence-low';
  };

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 0.9) return 'default';
    if (confidence >= 0.7) return 'secondary';
    return 'destructive';
  };

  const handleFieldEdit = (key: string, newValue: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.key === key
          ? { ...field, editedValue: newValue, isEdited: true, isConfirmed: true }
          : field
      )
    );
  };

  const handleFieldConfirm = (key: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.key === key ? { ...field, isConfirmed: !field.isConfirmed } : field
      )
    );
  };

  const handleConfirmAll = () => {
    setFields((prev) => prev.map((field) => ({ ...field, isConfirmed: true })));
  };

  const handleSubmit = () => {
    const reviewedData = fields.reduce((acc, field) => {
      acc[field.key] = field.editedValue;
      return acc;
    }, {} as Record<string, any>);
    onConfirm(reviewedData);
    onClose();
  };

  const confirmedCount = fields.filter((f) => f.isConfirmed).length;
  const allConfirmed = confirmedCount === fields.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              抽出結果の確認
            </div>
          </DialogTitle>
          <DialogDescription>
            OCRで抽出されたデータを確認し、必要に応じて修正してください
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'review' | 'preview')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="review" className="gap-2">
              <Edit2 className="h-4 w-4" />
              確認・編集
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              プレビュー
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="mt-4">
            <div className="space-y-4">
              {/* 統計情報 */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    抽出項目: <strong>{fields.length}</strong>
                  </span>
                  <span>
                    確認済み: <strong>{confirmedCount}</strong>
                  </span>
                  <span>
                    編集済み:{' '}
                    <strong>{fields.filter((f) => f.isEdited).length}</strong>
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={handleConfirmAll}>
                  すべて確認済みにする
                </Button>
              </div>

              {/* フィールドリスト */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      className={cn(
                        'rounded-lg border p-4 transition-colors',
                        field.isConfirmed ? 'bg-muted/20' : 'bg-background'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">{field.label}</Label>
                          {field.isEdited && (
                            <Badge variant="secondary" className="text-xs">
                              編集済み
                            </Badge>
                          )}
                          <Badge
                            variant={getConfidenceBadgeVariant(field.confidence)}
                            className="text-xs"
                          >
                            信頼度: {Math.round(field.confidence * 100)}%
                          </Badge>
                        </div>
                        <Button
                          variant={field.isConfirmed ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleFieldConfirm(field.key)}
                          className="h-7 px-2"
                        >
                          {field.isConfirmed ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              確認済み
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              未確認
                            </>
                          )}
                        </Button>
                      </div>

                      {editingField === field.key ? (
                        <div className="flex gap-2">
                          <Input
                            value={field.editedValue}
                            onChange={(e) => handleFieldEdit(field.key, e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => setEditingField(null)}
                            className="px-3"
                          >
                            完了
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2"
                          onClick={() => setEditingField(field.key)}
                        >
                          <span
                            className={cn(
                              'text-sm',
                              field.confidence < 0.7 && 'text-muted-foreground'
                            )}
                          >
                            {field.editedValue || '（未入力）'}
                          </span>
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}

                      {field.isEdited && field.originalValue !== field.editedValue && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          元の値: <span className="line-through">{field.originalValue}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* 低信頼度の警告 */}
              {fields.some((f) => f.confidence < 0.7) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    信頼度が低い項目があります。内容を確認して必要に応じて修正してください。
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <ScrollArea className="h-[450px]">
              <div className="space-y-4 pr-4">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold mb-4">確認済みデータ</h3>
                  <dl className="grid grid-cols-2 gap-4">
                    {fields
                      .filter((f) => f.isConfirmed)
                      .map((field) => (
                        <div key={field.key}>
                          <dt className="text-sm font-medium text-muted-foreground">
                            {field.label}
                          </dt>
                          <dd className="text-sm mt-1">
                            {field.editedValue || '（未入力）'}
                            {field.isEdited && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                編集済み
                              </Badge>
                            )}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>

                {fields.filter((f) => !f.isConfirmed).length > 0 && (
                  <div className="rounded-lg border bg-muted/20 p-6">
                    <h3 className="font-semibold mb-4 text-muted-foreground">
                      未確認のデータ
                    </h3>
                    <dl className="grid grid-cols-2 gap-4">
                      {fields
                        .filter((f) => !f.isConfirmed)
                        .map((field) => (
                          <div key={field.key} className="opacity-60">
                            <dt className="text-sm font-medium text-muted-foreground">
                              {field.label}
                            </dt>
                            <dd className="text-sm mt-1">
                              {field.editedValue || '（未入力）'}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!allConfirmed} className="gap-2">
            {allConfirmed ? (
              <>
                <Check className="h-4 w-4" />
                確定して適用
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                すべて確認してください ({confirmedCount}/{fields.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// フィールド名を日本語ラベルに変換
function formatFieldLabel(key: string): string {
  const labelMap: Record<string, string> = {
    companyName: '会社名',
    corporateName: '法人名',
    name: '氏名',
    representative: '代表者',
    address: '住所',
    postalCode: '郵便番号',
    phoneNumber: '電話番号',
    email: 'メールアドレス',
    businessName: '屋号',
    establishedDate: '設立年月日',
    capital: '資本金',
    businessPurpose: '事業目的',
    income: '所得金額',
    taxAmount: '納税額',
    taxYear: '年度',
    fiscalYearFrom: '事業年度（開始）',
    fiscalYearTo: '事業年度（終了）',
    corporateTax: '法人税額',
  };

  return labelMap[key] || key;
}