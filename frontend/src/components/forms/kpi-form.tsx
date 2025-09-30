'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  Calculator,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { GenerateResponse, ValidationResult } from '@/lib/api/types';

interface KPIItem {
  id: string;
  name: string;
  description?: string;
  unit: string;
  baseline: number;
  target: number;
  period: string;
  measurementMethod?: string;
  importance: 'high' | 'medium' | 'low';
}

interface KPIData {
  kpis: KPIItem[];
  evaluationCriteria?: string;
  monitoringFrequency?: string;
}

interface KPIFormProps {
  applicationId: string;
  data?: KPIData;
  onChange: (data: KPIData) => void;
  onValidate?: () => Promise<boolean>;
}

// 単位辞書
const UNIT_DICTIONARY: Record<string, string[]> = {
  数量: ['件', '個', '台', '本', '枚', '回'],
  時間: ['秒', '分', '時間', '日', '週', '月', '年'],
  金額: ['円', '千円', '万円', '百万円', '億円'],
  割合: ['%', 'ポイント', '倍'],
  人数: ['人', '名', '社'],
  面積: ['㎡', '坪', 'ha'],
  重量: ['g', 'kg', 't'],
  データ: ['KB', 'MB', 'GB', 'TB'],
  速度: ['件/時間', '個/日', '台/月'],
  その他: ['段階', 'レベル', 'スコア'],
};

const PERIOD_OPTIONS = [
  { value: '1month', label: '1ヶ月' },
  { value: '3months', label: '3ヶ月' },
  { value: '6months', label: '6ヶ月' },
  { value: '1year', label: '1年' },
  { value: '2years', label: '2年' },
  { value: '3years', label: '3年' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: '日次' },
  { value: 'weekly', label: '週次' },
  { value: 'monthly', label: '月次' },
  { value: 'quarterly', label: '四半期' },
  { value: 'yearly', label: '年次' },
];

export function KPIForm({ applicationId, data, onChange, onValidate }: KPIFormProps) {
  const [formData, setFormData] = useState<KPIData>(
    data || {
      kpis: [],
      evaluationCriteria: '',
      monitoringFrequency: 'monthly',
    }
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedUnitCategory, setSelectedUnitCategory] = useState<string>('数量');

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

  const handleKPIChange = (index: number, field: keyof KPIItem, value: any) => {
    const newKPIs = [...formData.kpis];
    newKPIs[index] = { ...newKPIs[index], [field]: value };
    handleFieldChange('kpis', newKPIs);
  };

  const addKPI = () => {
    const newKPI: KPIItem = {
      id: `kpi-${Date.now()}`,
      name: '',
      unit: '件',
      baseline: 0,
      target: 0,
      period: '1year',
      importance: 'medium',
    };
    handleFieldChange('kpis', [...formData.kpis, newKPI]);
  };

  const removeKPI = (index: number) => {
    const newKPIs = formData.kpis.filter((_, i) => i !== index);
    handleFieldChange('kpis', newKPIs);
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      // KPI生成APIを呼び出し
      setGenerationProgress(30);
      const response = await apiClient.post<GenerateResponse>('/generate/kpis', {
        application_id: applicationId,
      });

      setGenerationProgress(70);

      // レスポンスをパース
      const generatedKPIs = parseGeneratedKPIs(response.content);

      setGenerationProgress(90);

      // フォームデータを更新
      const newData: KPIData = {
        ...formData,
        kpis: generatedKPIs,
      };

      setFormData(newData);
      onChange(newData);
      setGenerationProgress(100);

      setTimeout(() => {
        setGenerationProgress(0);
        setActiveTab('manual');
      }, 1000);
    } catch (error: any) {
      setErrors({ generation: error.message || 'KPI生成に失敗しました' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async () => {
    try {
      const result = await apiClient.post<ValidationResult>('/validate/kpis', {
        kpis: formData.kpis,
      });
      setValidationResult(result);
    } catch (error: any) {
      setErrors({ validation: error.message || '検証に失敗しました' });
    }
  };

  const parseGeneratedKPIs = (content: string): KPIItem[] => {
    // 生成されたテキストからKPIを抽出
    const kpis: KPIItem[] = [];
    const lines = content.split('\n');
    
    let currentKPI: Partial<KPIItem> | null = null;
    
    for (const line of lines) {
      if (line.startsWith('KPI:')) {
        if (currentKPI && currentKPI.name) {
          kpis.push({
            id: `kpi-${Date.now()}-${kpis.length}`,
            name: currentKPI.name,
            description: currentKPI.description || '',
            unit: currentKPI.unit || '件',
            baseline: currentKPI.baseline || 0,
            target: currentKPI.target || 0,
            period: currentKPI.period || '1year',
            measurementMethod: currentKPI.measurementMethod,
            importance: currentKPI.importance || 'medium',
          });
        }
        currentKPI = { name: line.substring(4).trim() };
      } else if (currentKPI) {
        if (line.includes('説明:')) {
          currentKPI.description = line.split('説明:')[1].trim();
        } else if (line.includes('単位:')) {
          currentKPI.unit = line.split('単位:')[1].trim();
        } else if (line.includes('現状:')) {
          currentKPI.baseline = parseFloat(line.split('現状:')[1]) || 0;
        } else if (line.includes('目標:')) {
          currentKPI.target = parseFloat(line.split('目標:')[1]) || 0;
        } else if (line.includes('期間:')) {
          const periodText = line.split('期間:')[1].trim();
          currentKPI.period = mapPeriodText(periodText);
        } else if (line.includes('測定方法:')) {
          currentKPI.measurementMethod = line.split('測定方法:')[1].trim();
        } else if (line.includes('重要度:')) {
          const importance = line.split('重要度:')[1].trim();
          currentKPI.importance = mapImportance(importance);
        }
      }
    }
    
    // 最後のKPIを追加
    if (currentKPI && currentKPI.name) {
      kpis.push({
        id: `kpi-${Date.now()}-${kpis.length}`,
        name: currentKPI.name,
        description: currentKPI.description || '',
        unit: currentKPI.unit || '件',
        baseline: currentKPI.baseline || 0,
        target: currentKPI.target || 0,
        period: currentKPI.period || '1year',
        measurementMethod: currentKPI.measurementMethod,
        importance: currentKPI.importance || 'medium',
      });
    }
    
    return kpis.slice(0, 5); // 最大5件
  };

  const mapPeriodText = (text: string): string => {
    if (text.includes('1ヶ月')) return '1month';
    if (text.includes('3ヶ月')) return '3months';
    if (text.includes('6ヶ月') || text.includes('半年')) return '6months';
    if (text.includes('2年')) return '2years';
    if (text.includes('3年')) return '3years';
    return '1year';
  };

  const mapImportance = (text: string): 'high' | 'medium' | 'low' => {
    if (text.includes('高') || text.includes('重要')) return 'high';
    if (text.includes('低')) return 'low';
    return 'medium';
  };

  const calculateImprovement = (baseline: number, target: number): string => {
    if (baseline === 0) return target > 0 ? '新規' : '0%';
    const improvement = ((target - baseline) / baseline) * 100;
    return `${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.kpis || formData.kpis.length === 0) {
      newErrors.kpis = 'KPIを少なくとも1つ設定してください';
    } else if (formData.kpis.length < 3) {
      newErrors.kpis = 'KPIは3つ以上設定することを推奨します';
    } else if (formData.kpis.length > 5) {
      newErrors.kpis = 'KPIは5つ以内に絞ることを推奨します';
    }

    formData.kpis.forEach((kpi, index) => {
      if (!kpi.name) {
        newErrors[`kpi-${index}-name`] = 'KPI名は必須です';
      }
      if (kpi.target <= kpi.baseline) {
        newErrors[`kpi-${index}-target`] = '目標値は現状値より大きい値を設定してください';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          KPI（重要業績評価指標）
        </CardTitle>
        <CardDescription>
          事業の成果を測定するための定量的な指標を3〜5個設定してください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">手動入力</TabsTrigger>
            <TabsTrigger value="generate">AI生成</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6 mt-6">
            {/* KPIリスト */}
            <div className="space-y-4">
              {formData.kpis.map((kpi, index) => (
                <div key={kpi.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">KPI {index + 1}</Badge>
                      <Badge
                        variant={
                          kpi.importance === 'high'
                            ? 'destructive'
                            : kpi.importance === 'low'
                            ? 'secondary'
                            : 'default'
                        }
                      >
                        {kpi.importance === 'high' ? '高' : kpi.importance === 'low' ? '低' : '中'}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKPI(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor={`kpi-name-${index}`}>
                        指標名 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`kpi-name-${index}`}
                        value={kpi.name}
                        onChange={(e) => handleKPIChange(index, 'name', e.target.value)}
                        placeholder="例: 月間売上高"
                        className={errors[`kpi-${index}-name`] ? 'border-destructive' : ''}
                      />
                      {errors[`kpi-${index}-name`] && (
                        <p className="text-sm text-destructive mt-1">
                          {errors[`kpi-${index}-name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>単位カテゴリー</Label>
                      <Select
                        value={selectedUnitCategory}
                        onValueChange={setSelectedUnitCategory}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(UNIT_DICTIONARY).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`kpi-unit-${index}`}>単位</Label>
                      <Select
                        value={kpi.unit}
                        onValueChange={(value) => handleKPIChange(index, 'unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_DICTIONARY[selectedUnitCategory].map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`kpi-baseline-${index}`}>現状値</Label>
                      <Input
                        id={`kpi-baseline-${index}`}
                        type="number"
                        value={kpi.baseline}
                        onChange={(e) =>
                          handleKPIChange(index, 'baseline', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`kpi-target-${index}`}>
                        目標値 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`kpi-target-${index}`}
                        type="number"
                        value={kpi.target}
                        onChange={(e) =>
                          handleKPIChange(index, 'target', parseFloat(e.target.value) || 0)
                        }
                        placeholder="100"
                        className={errors[`kpi-${index}-target`] ? 'border-destructive' : ''}
                      />
                      {errors[`kpi-${index}-target`] && (
                        <p className="text-sm text-destructive mt-1">
                          {errors[`kpi-${index}-target`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`kpi-period-${index}`}>達成期間</Label>
                      <Select
                        value={kpi.period}
                        onValueChange={(value) => handleKPIChange(index, 'period', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERIOD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`kpi-importance-${index}`}>重要度</Label>
                      <Select
                        value={kpi.importance}
                        onValueChange={(value) =>
                          handleKPIChange(index, 'importance', value as 'high' | 'medium' | 'low')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">高</SelectItem>
                          <SelectItem value="medium">中</SelectItem>
                          <SelectItem value="low">低</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor={`kpi-description-${index}`}>説明</Label>
                      <textarea
                        id={`kpi-description-${index}`}
                        value={kpi.description || ''}
                        onChange={(e) => handleKPIChange(index, 'description', e.target.value)}
                        placeholder="この指標の意味や測定方法を説明"
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        rows={2}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor={`kpi-method-${index}`}>測定方法</Label>
                      <Input
                        id={`kpi-method-${index}`}
                        value={kpi.measurementMethod || ''}
                        onChange={(e) => handleKPIChange(index, 'measurementMethod', e.target.value)}
                        placeholder="例: Google Analyticsで月次集計"
                      />
                    </div>
                  </div>

                  {/* 改善率の表示 */}
                  {kpi.baseline > 0 && kpi.target > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <TrendingUp className="h-4 w-4 text-status-success" />
                      <span className="text-sm">
                        改善率: <strong>{calculateImprovement(kpi.baseline, kpi.target)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {formData.kpis.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addKPI}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  KPIを追加
                </Button>
              )}

              {errors.kpis && (
                <Alert variant={formData.kpis.length < 3 ? 'default' : 'destructive'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.kpis}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* 評価基準 */}
            <div className="space-y-2">
              <Label htmlFor="evaluationCriteria">評価基準</Label>
              <textarea
                id="evaluationCriteria"
                value={formData.evaluationCriteria || ''}
                onChange={(e) => handleFieldChange('evaluationCriteria', e.target.value)}
                placeholder="KPIの達成度をどのように評価するか、基準を記載"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            {/* モニタリング頻度 */}
            <div className="space-y-2">
              <Label htmlFor="monitoringFrequency">モニタリング頻度</Label>
              <Select
                value={formData.monitoringFrequency}
                onValueChange={(value) => handleFieldChange('monitoringFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 検証ボタン */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleValidate}
                disabled={formData.kpis.length === 0}
              >
                <Calculator className="h-4 w-4 mr-2" />
                KPIを検証
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
          </TabsContent>

          <TabsContent value="generate" className="space-y-6 mt-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                AIが事業内容に基づいて適切なKPIを自動生成します。
                生成後は手動で編集可能です。
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {!isGenerating && (
                <Button onClick={handleAutoGenerate} className="w-full gap-2" size="lg">
                  <Sparkles className="h-4 w-4" />
                  KPIを自動生成
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
                    {generationProgress >= 30 && generationProgress < 70 && 'KPIを生成中...'}
                    {generationProgress >= 70 && generationProgress < 90 && '目標値を最適化中...'}
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
                  <p className="font-medium">生成されるKPIの特徴：</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>SMART原則（具体的・測定可能・達成可能・関連性・期限）に準拠</li>
                    <li>業界標準のベンチマークを考慮</li>
                    <li>補助金の評価基準に適合</li>
                    <li>3〜5個の最適な指標を提案</li>
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