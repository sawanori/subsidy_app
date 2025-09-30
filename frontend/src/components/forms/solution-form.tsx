'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lightbulb,
  Sparkles,
  Plus,
  X,
  AlertCircle,
  Info,
  Loader2,
  Target,
  Zap,
  Shield,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { GenerateResponse } from '@/lib/api/types';

interface SolutionItem {
  id: string;
  title: string;
  description: string;
  expectedEffect: string;
  priority: 'high' | 'medium' | 'low';
  budget?: number;
}

interface SolutionData {
  mainSolution?: string;
  solutionItems?: SolutionItem[];
  implementation?: string;
  differentiation?: string;
  riskMitigation?: string;
  evidence?: Array<{
    id: string;
    text: string;
    url: string;
  }>;
}

interface SolutionFormProps {
  applicationId: string;
  backgroundId?: string;
  data?: SolutionData;
  onChange: (data: SolutionData) => void;
  onValidate?: () => Promise<boolean>;
}

export function SolutionForm({
  applicationId,
  backgroundId,
  data,
  onChange,
  onValidate,
}: SolutionFormProps) {
  const [formData, setFormData] = useState<SolutionData>(data || {});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('manual');

  const CHARACTER_LIMITS = {
    mainSolution: 800,
    implementation: 600,
    differentiation: 400,
    riskMitigation: 400,
  };

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

  const handleAutoGenerate = async () => {
    if (!backgroundId) {
      setErrors({ generation: '背景情報を先に入力してください' });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      setGenerationProgress(30);
      const response = await apiClient.post<GenerateResponse>('/generate/solution', {
        application_id: applicationId,
        background_id: backgroundId,
      });

      setGenerationProgress(70);

      const generatedContent = parseGeneratedSolution(response.content);

      setGenerationProgress(90);

      const newData: SolutionData = {
        ...formData,
        ...generatedContent,
        evidence: response.citations.map((c) => ({
          id: c.evidence_id,
          text: c.text,
          url: c.url,
        })),
      };

      setFormData(newData);
      onChange(newData);
      setGenerationProgress(100);

      setTimeout(() => {
        setGenerationProgress(0);
        setActiveTab('manual');
      }, 1000);
    } catch (error: any) {
      setErrors({ generation: error.message || '生成に失敗しました' });
    } finally {
      setIsGenerating(false);
    }
  };

  const parseGeneratedSolution = (content: string): Partial<SolutionData> => {
    const sections: Partial<SolutionData> = {};

    // メイン解決策の抽出
    const mainMatch = content.match(/【解決策】\s*([\s\S]*?)(?=【|$)/);
    if (mainMatch) {
      sections.mainSolution = mainMatch[1].trim();
    }

    // 実装方法の抽出
    const implMatch = content.match(/【実装方法】\s*([\s\S]*?)(?=【|$)/);
    if (implMatch) {
      sections.implementation = implMatch[1].trim();
    }

    // 差別化の抽出
    const diffMatch = content.match(/【差別化要素】\s*([\s\S]*?)(?=【|$)/);
    if (diffMatch) {
      sections.differentiation = diffMatch[1].trim();
    }

    // リスク対策の抽出
    const riskMatch = content.match(/【リスク対策】\s*([\s\S]*?)(?=【|$)/);
    if (riskMatch) {
      sections.riskMitigation = riskMatch[1].trim();
    }

    // 施策項目の抽出
    const itemsMatch = content.match(/【施策項目】\s*([\s\S]*?)(?=【|$)/);
    if (itemsMatch) {
      const items: SolutionItem[] = [];
      const lines = itemsMatch[1].split('\n');

      for (const line of lines) {
        if (line.trim().startsWith('・')) {
          const parts = line.substring(1).trim().split('：');
          if (parts.length >= 2) {
            items.push({
              id: `item_${Date.now()}_${Math.random()}`,
              title: parts[0].trim(),
              description: parts[1].trim(),
              expectedEffect: '',
              priority: 'medium',
            });
          }
        }
      }

      sections.solutionItems = items;
    }

    return sections;
  };

  const addSolutionItem = () => {
    const newItem: SolutionItem = {
      id: `item_${Date.now()}`,
      title: '',
      description: '',
      expectedEffect: '',
      priority: 'medium',
    };

    const items = [...(formData.solutionItems || []), newItem];
    handleFieldChange('solutionItems', items);
  };

  const updateSolutionItem = (id: string, field: keyof SolutionItem, value: any) => {
    const items = (formData.solutionItems || []).map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    handleFieldChange('solutionItems', items);
  };

  const removeSolutionItem = (id: string) => {
    const items = (formData.solutionItems || []).filter((item) => item.id !== id);
    handleFieldChange('solutionItems', items);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.mainSolution) {
      newErrors.mainSolution = '解決策の概要は必須です';
    }
    if (!formData.solutionItems || formData.solutionItems.length === 0) {
      newErrors.solutionItems = '施策項目を少なくとも1つ入力してください';
    }
    if (!formData.implementation) {
      newErrors.implementation = '実装方法は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          解決策・施策内容
        </CardTitle>
        <CardDescription>
          課題を解決するための具体的な施策を記入してください。AIによる自動生成も利用できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">手動入力</TabsTrigger>
            <TabsTrigger value="generate">AI生成</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6 mt-6">
            {/* 解決策の概要 */}
            <div className="space-y-2">
              <Label htmlFor="mainSolution">
                解決策の概要 <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="mainSolution"
                value={formData.mainSolution || ''}
                onChange={(e) => handleFieldChange('mainSolution', e.target.value)}
                placeholder="課題を解決するための全体的なアプローチ、戦略を記載"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={5}
              />
              {errors.mainSolution && (
                <p className="text-sm text-destructive">{errors.mainSolution}</p>
              )}
            </div>

            {/* 施策項目 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  具体的な施策項目 <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSolutionItem}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  項目追加
                </Button>
              </div>

              {(formData.solutionItems || []).map((item, index) => (
                <div key={item.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(item.priority)}>
                        {item.priority === 'high' && '高'}
                        {item.priority === 'medium' && '中'}
                        {item.priority === 'low' && '低'}
                      </Badge>
                      <span className="text-sm font-medium">施策 {index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSolutionItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <Label>タイトル</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateSolutionItem(item.id, 'title', e.target.value)}
                        placeholder="DXツール導入"
                      />
                    </div>

                    <div>
                      <Label>内容</Label>
                      <textarea
                        value={item.description}
                        onChange={(e) =>
                          updateSolutionItem(item.id, 'description', e.target.value)
                        }
                        placeholder="業務プロセスのデジタル化により効率化を実現"
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>期待効果</Label>
                      <Input
                        value={item.expectedEffect}
                        onChange={(e) =>
                          updateSolutionItem(item.id, 'expectedEffect', e.target.value)
                        }
                        placeholder="業務時間30%削減"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>優先度</Label>
                        <select
                          value={item.priority}
                          onChange={(e) =>
                            updateSolutionItem(
                              item.id,
                              'priority',
                              e.target.value as 'high' | 'medium' | 'low'
                            )
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                        </select>
                      </div>

                      <div>
                        <Label>予算（円）</Label>
                        <Input
                          type="number"
                          value={item.budget || ''}
                          onChange={(e) =>
                            updateSolutionItem(item.id, 'budget', parseInt(e.target.value))
                          }
                          placeholder="1000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {errors.solutionItems && (
                <p className="text-sm text-destructive">{errors.solutionItems}</p>
              )}
            </div>

            {/* 実装方法 */}
            <div className="space-y-2">
              <Label htmlFor="implementation">
                実装方法 <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="implementation"
                value={formData.implementation || ''}
                onChange={(e) => handleFieldChange('implementation', e.target.value)}
                placeholder="施策を実行するための具体的なステップ、必要なリソース、体制など"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
              />
              {errors.implementation && (
                <p className="text-sm text-destructive">{errors.implementation}</p>
              )}
            </div>

            {/* 差別化要素 */}
            <div className="space-y-2">
              <Label htmlFor="differentiation">
                差別化要素
              </Label>
              <textarea
                id="differentiation"
                value={formData.differentiation || ''}
                onChange={(e) => handleFieldChange('differentiation', e.target.value)}
                placeholder="競合と比較した優位性、独自性など"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            {/* リスク対策 */}
            <div className="space-y-2">
              <Label htmlFor="riskMitigation">
                リスク対策
              </Label>
              <textarea
                id="riskMitigation"
                value={formData.riskMitigation || ''}
                onChange={(e) => handleFieldChange('riskMitigation', e.target.value)}
                placeholder="想定されるリスクと対策"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6 mt-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                背景情報を基にAIが最適な解決策を提案します。生成後は自由に編集できます。
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {!isGenerating && (
                <Button
                  onClick={handleAutoGenerate}
                  className="w-full gap-2"
                  size="lg"
                  disabled={!backgroundId}
                >
                  <Sparkles className="h-4 w-4" />
                  解決策を自動生成
                </Button>
              )}

              {isGenerating && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    {generationProgress < 30 && '課題を分析中...'}
                    {generationProgress >= 30 && generationProgress < 70 && '解決策を生成中...'}
                    {generationProgress >= 70 && generationProgress < 90 && '施策を最適化中...'}
                    {generationProgress >= 90 && '最終調整中...'}
                  </p>
                </div>
              )}

              {!backgroundId && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    背景情報を先に入力してください。背景情報を基に最適な解決策を生成します。
                  </AlertDescription>
                </Alert>
              )}

              {errors.generation && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.generation}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">的確性</p>
                <p className="text-xs text-muted-foreground">課題に対応した解決策</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">実現性</p>
                <p className="text-xs text-muted-foreground">実行可能な施策</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">持続性</p>
                <p className="text-xs text-muted-foreground">長期的な効果</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              解決策は具体的で測定可能な内容にしてください。
              実装の実現性と期待される効果を明確に示すことが重要です。
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}