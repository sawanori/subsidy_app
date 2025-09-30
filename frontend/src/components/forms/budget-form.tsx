'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Plus,
  Trash2,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { GenerateResponse, ValidationResult } from '@/lib/api/types';

interface BudgetItem {
  id: string;
  category: string;
  subcategory?: string;
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  totalAmount: number;
  isEligible: boolean;
  subsidyRate: number;
  subsidyAmount: number;
  selfFundAmount: number;
  remarks?: string;
}

interface BudgetData {
  items: BudgetItem[];
  totalBudget: number;
  totalSubsidy: number;
  totalSelfFund: number;
  defaultSubsidyRate: number;
  maxSubsidyAmount?: number;
  budgetNotes?: string;
}

interface BudgetFormProps {
  applicationId: string;
  data?: BudgetData;
  onChange: (data: BudgetData) => void;
  onValidate?: () => Promise<boolean>;
}

// 費目カテゴリー
const BUDGET_CATEGORIES = [
  { value: 'equipment', label: '機械装置等費', subcategories: ['機械装置', '工具器具', 'ソフトウェア'] },
  { value: 'construction', label: '建物費', subcategories: ['建築工事', '改装費', '設備工事'] },
  { value: 'outsourcing', label: '外注費', subcategories: ['システム開発', 'デザイン', 'コンサルティング'] },
  { value: 'specialist', label: '専門家経費', subcategories: ['講師謝金', 'アドバイザー費', '指導料'] },
  { value: 'travel', label: '旅費', subcategories: ['交通費', '宿泊費', '日当'] },
  { value: 'marketing', label: '広告費', subcategories: ['Web広告', 'パンフレット', '展示会'] },
  { value: 'other', label: 'その他経費', subcategories: ['消耗品', '通信費', '予備費'] },
];

// 単位の選択肢
const UNIT_OPTIONS = ['個', '台', '式', '件', '人日', '人月', '回', '時間', 'ヶ月', '年'];

// 補助率のプリセット
const SUBSIDY_RATE_PRESETS = [
  { value: 100, label: '100% (全額補助)' },
  { value: 75, label: '3/4 (75%)' },
  { value: 66.67, label: '2/3 (66.67%)' },
  { value: 50, label: '1/2 (50%)' },
  { value: 33.33, label: '1/3 (33.33%)' },
  { value: 0, label: '補助対象外' },
];

export function BudgetForm({ applicationId, data, onChange, onValidate }: BudgetFormProps) {
  const [formData, setFormData] = useState<BudgetData>(
    data || {
      items: [],
      totalBudget: 0,
      totalSubsidy: 0,
      totalSelfFund: 0,
      defaultSubsidyRate: 50,
    }
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedCategory, setSelectedCategory] = useState<string>('equipment');

  // 合計金額の再計算
  useEffect(() => {
    const totalBudget = formData.items.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalSubsidy = formData.items.reduce((sum, item) => sum + item.subsidyAmount, 0);
    const totalSelfFund = formData.items.reduce((sum, item) => sum + item.selfFundAmount, 0);

    const newData = {
      ...formData,
      totalBudget,
      totalSubsidy,
      totalSelfFund,
    };
    setFormData(newData);
    onChange(newData);
  }, [formData.items]);

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);

    // エラークリア
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleItemChange = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };

    // 金額の自動計算
    if (field === 'unitPrice' || field === 'quantity') {
      item.totalAmount = item.unitPrice * item.quantity;
    }

    if (field === 'totalAmount' || field === 'subsidyRate' || field === 'isEligible') {
      if (item.isEligible) {
        item.subsidyAmount = Math.floor((item.totalAmount * item.subsidyRate) / 100);
        item.selfFundAmount = item.totalAmount - item.subsidyAmount;
      } else {
        item.subsidyAmount = 0;
        item.selfFundAmount = item.totalAmount;
      }
    }

    newItems[index] = item;
    handleFieldChange('items', newItems);
  };

  const addBudgetItem = () => {
    const category = BUDGET_CATEGORIES.find((c) => c.value === selectedCategory);
    const newItem: BudgetItem = {
      id: `item-${Date.now()}`,
      category: category?.label || '',
      name: '',
      unitPrice: 0,
      quantity: 1,
      unit: '個',
      totalAmount: 0,
      isEligible: true,
      subsidyRate: formData.defaultSubsidyRate,
      subsidyAmount: 0,
      selfFundAmount: 0,
    };
    handleFieldChange('items', [...formData.items, newItem]);
  };

  const removeBudgetItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    handleFieldChange('items', newItems);
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      // 予算生成APIを呼び出し
      setGenerationProgress(30);
      const response = await apiClient.post<GenerateResponse>('/generate/budget', {
        application_id: applicationId,
      });

      setGenerationProgress(70);

      // レスポンスをパース
      const generatedItems = parseGeneratedBudget(response.content);

      setGenerationProgress(90);

      // フォームデータを更新
      const newData: BudgetData = {
        ...formData,
        items: generatedItems,
      };

      setFormData(newData);
      onChange(newData);
      setGenerationProgress(100);

      setTimeout(() => {
        setGenerationProgress(0);
        setActiveTab('manual');
      }, 1000);
    } catch (error: any) {
      setErrors({ generation: error.message || '予算生成に失敗しました' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async () => {
    try {
      const result = await apiClient.post<ValidationResult>('/validate/budget', {
        items: formData.items,
        total_budget: formData.totalBudget,
        total_subsidy: formData.totalSubsidy,
      });
      setValidationResult(result);
    } catch (error: any) {
      setErrors({ validation: error.message || '検証に失敗しました' });
    }
  };

  const parseGeneratedBudget = (content: string): BudgetItem[] => {
    const items: BudgetItem[] = [];
    const lines = content.split('\n');
    
    let currentItem: Partial<BudgetItem> | null = null;
    
    for (const line of lines) {
      if (line.startsWith('■') || line.startsWith('【')) {
        if (currentItem && currentItem.name) {
          const totalAmount = (currentItem.unitPrice || 0) * (currentItem.quantity || 1);
          const subsidyAmount = currentItem.isEligible
            ? Math.floor((totalAmount * (currentItem.subsidyRate || 50)) / 100)
            : 0;
          
          items.push({
            id: `item-${Date.now()}-${items.length}`,
            category: currentItem.category || 'その他経費',
            name: currentItem.name,
            description: currentItem.description,
            unitPrice: currentItem.unitPrice || 0,
            quantity: currentItem.quantity || 1,
            unit: currentItem.unit || '個',
            totalAmount,
            isEligible: currentItem.isEligible !== false,
            subsidyRate: currentItem.subsidyRate || 50,
            subsidyAmount,
            selfFundAmount: totalAmount - subsidyAmount,
          });
        }
        
        const categoryMatch = line.match(/【(.+?)】/);
        currentItem = {
          category: categoryMatch ? categoryMatch[1] : line.replace('■', '').trim(),
        };
      } else if (currentItem) {
        if (line.includes('品名:') || line.includes('項目:')) {
          currentItem.name = line.split(/[:：]/)[1]?.trim();
        } else if (line.includes('単価:')) {
          currentItem.unitPrice = parseFloat(line.match(/[\d,]+/)?.[0]?.replace(',', '') || '0');
        } else if (line.includes('数量:')) {
          const match = line.match(/([\d,]+)\s*(\S+)/);
          if (match) {
            currentItem.quantity = parseFloat(match[1].replace(',', ''));
            currentItem.unit = match[2];
          }
        } else if (line.includes('補助率:')) {
          const match = line.match(/([\d.]+)%/);
          if (match) {
            currentItem.subsidyRate = parseFloat(match[1]);
          }
        } else if (line.includes('補助対象外')) {
          currentItem.isEligible = false;
          currentItem.subsidyRate = 0;
        } else if (line.includes('説明:') || line.includes('内容:')) {
          currentItem.description = line.split(/[:：]/)[1]?.trim();
        }
      }
    }
    
    // 最後の項目を追加
    if (currentItem && currentItem.name) {
      const totalAmount = (currentItem.unitPrice || 0) * (currentItem.quantity || 1);
      const subsidyAmount = currentItem.isEligible !== false
        ? Math.floor((totalAmount * (currentItem.subsidyRate || 50)) / 100)
        : 0;
      
      items.push({
        id: `item-${Date.now()}-${items.length}`,
        category: currentItem.category || 'その他経費',
        name: currentItem.name,
        description: currentItem.description,
        unitPrice: currentItem.unitPrice || 0,
        quantity: currentItem.quantity || 1,
        unit: currentItem.unit || '個',
        totalAmount,
        isEligible: currentItem.isEligible !== false,
        subsidyRate: currentItem.subsidyRate || 50,
        subsidyAmount,
        selfFundAmount: totalAmount - subsidyAmount,
      });
    }
    
    return items;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.items || formData.items.length === 0) {
      newErrors.items = '予算項目を少なくとも1つ追加してください';
    }

    formData.items.forEach((item, index) => {
      if (!item.name) {
        newErrors[`item-${index}-name`] = '項目名は必須です';
      }
      if (item.unitPrice <= 0) {
        newErrors[`item-${index}-price`] = '単価は0より大きい値を入力してください';
      }
      if (item.quantity <= 0) {
        newErrors[`item-${index}-quantity`] = '数量は0より大きい値を入力してください';
      }
    });

    if (formData.maxSubsidyAmount && formData.totalSubsidy > formData.maxSubsidyAmount) {
      newErrors.maxSubsidy = `補助金額が上限（${formatCurrency(formData.maxSubsidyAmount)}）を超えています`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          事業予算
        </CardTitle>
        <CardDescription>
          事業に必要な経費を費目ごとに入力し、補助対象と補助率を設定してください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">手動入力</TabsTrigger>
            <TabsTrigger value="generate">AI生成</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6 mt-6">
            {/* デフォルト補助率と上限額 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultSubsidyRate">デフォルト補助率</Label>
                <Select
                  value={formData.defaultSubsidyRate.toString()}
                  onValueChange={(value) => handleFieldChange('defaultSubsidyRate', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSIDY_RATE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value.toString()}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxSubsidyAmount">補助金上限額</Label>
                <Input
                  id="maxSubsidyAmount"
                  type="number"
                  value={formData.maxSubsidyAmount || ''}
                  onChange={(e) => handleFieldChange('maxSubsidyAmount', parseInt(e.target.value) || undefined)}
                  placeholder="10000000"
                />
                {errors.maxSubsidy && (
                  <p className="text-sm text-destructive mt-1">{errors.maxSubsidy}</p>
                )}
              </div>
            </div>

            {/* 予算項目リスト */}
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.category}</Badge>
                      {item.isEligible ? (
                        <Badge variant="default">補助対象</Badge>
                      ) : (
                        <Badge variant="secondary">補助対象外</Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBudgetItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor={`item-name-${index}`}>
                        項目名 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`item-name-${index}`}
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="例: ノートPC"
                        className={errors[`item-${index}-name`] ? 'border-destructive' : ''}
                      />
                      {errors[`item-${index}-name`] && (
                        <p className="text-sm text-destructive mt-1">{errors[`item-${index}-name`]}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor={`item-description-${index}`}>説明</Label>
                      <textarea
                        id={`item-description-${index}`}
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="用途や仕様などを記載"
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`item-unitPrice-${index}`}>
                        単価（円） <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`item-unitPrice-${index}`}
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="100000"
                        className={errors[`item-${index}-price`] ? 'border-destructive' : ''}
                      />
                      {errors[`item-${index}-price`] && (
                        <p className="text-sm text-destructive mt-1">{errors[`item-${index}-price`]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`item-quantity-${index}`}>
                          数量 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`item-quantity-${index}`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="1"
                          className={errors[`item-${index}-quantity`] ? 'border-destructive' : ''}
                        />
                        {errors[`item-${index}-quantity`] && (
                          <p className="text-sm text-destructive mt-1">{errors[`item-${index}-quantity`]}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`item-unit-${index}`}>単位</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => handleItemChange(index, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-3 gap-4">
                      <div>
                        <Label>小計</Label>
                        <div className="text-lg font-semibold">{formatCurrency(item.totalAmount)}</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`item-eligible-${index}`}
                          checked={item.isEligible}
                          onCheckedChange={(checked) => handleItemChange(index, 'isEligible', checked)}
                        />
                        <Label htmlFor={`item-eligible-${index}`}>補助対象</Label>
                      </div>

                      <div>
                        <Label htmlFor={`item-subsidyRate-${index}`}>補助率</Label>
                        <Select
                          value={item.subsidyRate.toString()}
                          onValueChange={(value) => handleItemChange(index, 'subsidyRate', parseFloat(value))}
                          disabled={!item.isEligible}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBSIDY_RATE_PRESETS.map((preset) => (
                              <SelectItem key={preset.value} value={preset.value.toString()}>
                                {preset.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 補助金額表示 */}
                    <div className="col-span-2 grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                      <div>
                        <span className="text-sm text-muted-foreground">補助金額:</span>
                        <div className="text-lg font-semibold text-status-success">
                          {formatCurrency(item.subsidyAmount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">自己負担額:</span>
                        <div className="text-lg font-semibold">{formatCurrency(item.selfFundAmount)}</div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor={`item-remarks-${index}`}>備考</Label>
                      <Input
                        id={`item-remarks-${index}`}
                        value={item.remarks || ''}
                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                        placeholder="特記事項があれば記載"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={addBudgetItem} className="flex-1 gap-2">
                  <Plus className="h-4 w-4" />
                  項目を追加
                </Button>
              </div>

              {errors.items && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.items}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* 合計表示 */}
            {formData.items.length > 0 && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    予算サマリー
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">事業総額</span>
                      <div className="text-2xl font-bold">{formatCurrency(formData.totalBudget)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">補助金額</span>
                      <div className="text-2xl font-bold text-status-success">
                        {formatCurrency(formData.totalSubsidy)}
                      </div>
                      {formData.totalBudget > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({((formData.totalSubsidy / formData.totalBudget) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">自己負担額</span>
                      <div className="text-2xl font-bold">{formatCurrency(formData.totalSelfFund)}</div>
                      {formData.totalBudget > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({((formData.totalSelfFund / formData.totalBudget) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* カテゴリー別内訳 */}
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-medium">費目別内訳</h4>
                    {BUDGET_CATEGORIES.map((category) => {
                      const categoryItems = formData.items.filter((item) => item.category === category.label);
                      const categoryTotal = categoryItems.reduce((sum, item) => sum + item.totalAmount, 0);
                      const categorySubsidy = categoryItems.reduce((sum, item) => sum + item.subsidyAmount, 0);
                      
                      if (categoryTotal === 0) return null;
                      
                      return (
                        <div key={category.value} className="flex items-center justify-between text-sm">
                          <span>{category.label}</span>
                          <div className="flex gap-4">
                            <span>{formatCurrency(categoryTotal)}</span>
                            <span className="text-status-success">(補助: {formatCurrency(categorySubsidy)})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 検証ボタン */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleValidate}
                disabled={formData.items.length === 0}
              >
                <Calculator className="h-4 w-4 mr-2" />
                予算を検証
              </Button>
            </div>

            {/* 検証結果 */}
            {validationResult && (
              <Alert variant={validationResult.is_valid ? 'default' : 'destructive'}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {validationResult.is_valid ? '検証成功' : '検証エラー'}
                    </p>
                    {validationResult.messages.map((msg, i) => (
                      <p key={i} className="text-sm">
                        {msg}
                      </p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* 予算メモ */}
            <div className="space-y-2">
              <Label htmlFor="budgetNotes">予算に関する説明・注記</Label>
              <textarea
                id="budgetNotes"
                value={formData.budgetNotes || ''}
                onChange={(e) => handleFieldChange('budgetNotes', e.target.value)}
                placeholder="予算編成の考え方、特記事項などを記載"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6 mt-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                AIが事業内容に基づいて適切な予算を自動生成します。
                生成後は手動で編集可能です。
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {!isGenerating && (
                <Button onClick={handleAutoGenerate} className="w-full gap-2" size="lg">
                  <Sparkles className="h-4 w-4" />
                  予算を自動生成
                </Button>
              )}

              {isGenerating && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    {generationProgress < 30 && '事業内容を分析中...'}
                    {generationProgress >= 30 && generationProgress < 70 && '必要経費を積算中...'}
                    {generationProgress >= 70 && generationProgress < 90 && '補助対象を判定中...'}
                    {generationProgress >= 90 && '最終調整中...'}
                  </p>
                </div>
              )}

              {errors.generation && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.generation}</AlertDescription>
                </Alert>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">生成される予算の特徴：</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>補助金の対象経費ガイドラインに準拠</li>
                    <li>市場価格に基づいた適正な単価設定</li>
                    <li>費目ごとのバランスを考慮</li>
                    <li>一般的な補助率（1/2、2/3等）を適用</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}