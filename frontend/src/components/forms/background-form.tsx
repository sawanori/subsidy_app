'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { GenerateResponse } from '@/lib/api/types';

interface BackgroundData {
  currentSituation?: string;
  challenges?: string[];
  marketEnvironment?: string;
  competitiveAdvantage?: string;
  necessityReason?: string;
  evidence?: Array<{
    id: string;
    text: string;
    url: string;
  }>;
}

interface BackgroundFormProps {
  applicationId: string;
  data?: BackgroundData;
  onChange: (data: BackgroundData) => void;
  onValidate?: () => Promise<boolean>;
}

export function BackgroundForm({
  applicationId,
  data,
  onChange,
  onValidate,
}: BackgroundFormProps) {
  const [formData, setFormData] = useState<BackgroundData>(data || {});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [characterCounts, setCharacterCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState('manual');

  const CHARACTER_LIMITS = {
    currentSituation: 500,
    marketEnvironment: 300,
    competitiveAdvantage: 300,
    necessityReason: 400,
  };

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);

    // 文字数カウント更新
    if (typeof value === 'string') {
      setCharacterCounts((prev) => ({ ...prev, [field]: value.length }));
    }

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
    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      // 背景生成APIを呼び出し
      setGenerationProgress(30);
      const response = await apiClient.post<GenerateResponse>('/generate/background', {
        application_id: applicationId,
        evidence_ids: formData.evidence?.map((e) => e.id) || [],
      });

      setGenerationProgress(70);

      // レスポンスをパース
      const generatedContent = parseGeneratedBackground(response.content);

      setGenerationProgress(90);

      // フォームデータを更新
      const newData: BackgroundData = {
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

  const parseGeneratedBackground = (content: string): Partial<BackgroundData> => {
    // 生成されたテキストをセクションごとに分割
    const sections: Partial<BackgroundData> = {};

    const sectionPatterns = {
      currentSituation: /【現状】\s*([\s\S]*?)(?=【|$)/,
      marketEnvironment: /【市場環境】\s*([\s\S]*?)(?=【|$)/,
      competitiveAdvantage: /【競争優位性】\s*([\s\S]*?)(?=【|$)/,
      necessityReason: /【必要性】\s*([\s\S]*?)(?=【|$)/,
    };

    for (const [key, pattern] of Object.entries(sectionPatterns)) {
      const match = content.match(pattern);
      if (match && match[1]) {
        sections[key] = match[1].trim();
      }
    }

    // 課題の抽出
    const challengeMatch = content.match(/【課題】\s*([\s\S]*?)(?=【|$)/);
    if (challengeMatch && challengeMatch[1]) {
      sections.challenges = challengeMatch[1]
        .split(/\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('・'))
        .map((line) => line.substring(1).trim());
    }

    return sections;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentSituation) {
      newErrors.currentSituation = '現在の状況は必須です';
    }
    if (!formData.challenges || formData.challenges.length === 0) {
      newErrors.challenges = '課題を少なくとも1つ入力してください';
    }
    if (!formData.necessityReason) {
      newErrors.necessityReason = '補助金の必要性は必須です';
    }

    // 文字数超過チェック
    for (const [field, limit] of Object.entries(CHARACTER_LIMITS)) {
      const value = formData[field];
      if (typeof value === 'string' && value.length > limit) {
        newErrors[field] = `文字数が上限（${limit}文字）を超えています`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addChallenge = () => {
    const challenges = formData.challenges || [];
    handleFieldChange('challenges', [...challenges, '']);
  };

  const updateChallenge = (index: number, value: string) => {
    const challenges = [...(formData.challenges || [])];
    challenges[index] = value;
    handleFieldChange('challenges', challenges);
  };

  const removeChallenge = (index: number) => {
    const challenges = [...(formData.challenges || [])];
    challenges.splice(index, 1);
    handleFieldChange('challenges', challenges);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          事業背景・課題
        </CardTitle>
        <CardDescription>
          現在の事業状況と解決すべき課題を記入してください。AIによる自動生成も利用できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">手動入力</TabsTrigger>
            <TabsTrigger value="generate">AI生成</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6 mt-6">
            {/* 現在の状況 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="currentSituation">
                  現在の状況 <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {characterCounts.currentSituation || 0} / {CHARACTER_LIMITS.currentSituation}
                </span>
              </div>
              <textarea
                id="currentSituation"
                value={formData.currentSituation || ''}
                onChange={(e) => handleFieldChange('currentSituation', e.target.value)}
                placeholder="現在の事業の状況、売上規模、従業員数、主要顧客などを記載"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={4}
              />
              {errors.currentSituation && (
                <p className="text-sm text-destructive">{errors.currentSituation}</p>
              )}
            </div>

            {/* 課題 */}
            <div className="space-y-2">
              <Label>
                課題・問題点 <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {(formData.challenges || []).map((challenge, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={challenge}
                      onChange={(e) => updateChallenge(index, e.target.value)}
                      placeholder={`課題 ${index + 1}`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChallenge(index)}
                    >
                      削除
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChallenge}
                  className="w-full"
                >
                  課題を追加
                </Button>
              </div>
              {errors.challenges && (
                <p className="text-sm text-destructive">{errors.challenges}</p>
              )}
            </div>

            {/* 市場環境 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="marketEnvironment">市場環境</Label>
                <span className="text-xs text-muted-foreground">
                  {characterCounts.marketEnvironment || 0} / {CHARACTER_LIMITS.marketEnvironment}
                </span>
              </div>
              <textarea
                id="marketEnvironment"
                value={formData.marketEnvironment || ''}
                onChange={(e) => handleFieldChange('marketEnvironment', e.target.value)}
                placeholder="業界の動向、市場規模、成長性など"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            {/* 競争優位性 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="competitiveAdvantage">競争優位性</Label>
                <span className="text-xs text-muted-foreground">
                  {characterCounts.competitiveAdvantage || 0} / {CHARACTER_LIMITS.competitiveAdvantage}
                </span>
              </div>
              <textarea
                id="competitiveAdvantage"
                value={formData.competitiveAdvantage || ''}
                onChange={(e) => handleFieldChange('competitiveAdvantage', e.target.value)}
                placeholder="自社の強み、独自技術、差別化要素など"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            {/* 補助金の必要性 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="necessityReason">
                  補助金の必要性 <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {characterCounts.necessityReason || 0} / {CHARACTER_LIMITS.necessityReason}
                </span>
              </div>
              <textarea
                id="necessityReason"
                value={formData.necessityReason || ''}
                onChange={(e) => handleFieldChange('necessityReason', e.target.value)}
                placeholder="なぜ補助金が必要か、どのように活用するか"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
              />
              {errors.necessityReason && (
                <p className="text-sm text-destructive">{errors.necessityReason}</p>
              )}
            </div>

            {/* エビデンス */}
            {formData.evidence && formData.evidence.length > 0 && (
              <div className="space-y-2">
                <Label>引用・根拠資料</Label>
                <div className="space-y-2">
                  {formData.evidence.map((ev, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <div className="flex-1">
                        <p className="text-muted-foreground">{ev.text}</p>
                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {ev.url}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-6 mt-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                AIが申請内容に基づいて背景説明を自動生成します。生成後は手動で編集可能です。
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {!isGenerating && (
                <Button
                  onClick={handleAutoGenerate}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4" />
                  背景説明を自動生成
                </Button>
              )}

              {isGenerating && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    {generationProgress < 30 && 'データを分析中...'}
                    {generationProgress >= 30 && generationProgress < 70 && '背景情報を生成中...'}
                    {generationProgress >= 70 && generationProgress < 90 && 'エビデンスを収集中...'}
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

            <div className="space-y-2">
              <Label>生成オプション</Label>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">市場データを含める</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">競合分析を含める</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">根拠資料の引用を含める</span>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              背景説明は審査員が最初に読む重要な部分です。
              具体的な数値や事実を含め、説得力のある内容にしましょう。
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}