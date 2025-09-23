'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  AlertCircle,
  Target,
  Lightbulb,
  TreePine
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIAssistantButton } from '@/components/ai/AIAssistantButton';
import type { PurposeBackground, CurrentIssue } from '@/types/application-extended';

const purposeBackgroundSchema = z.object({
  currentIssues: z.array(z.object({
    category: z.string().min(1, 'カテゴリを選択してください'),
    description: z.string().min(10, '課題の説明は10文字以上で入力してください'),
    impact: z.string().min(1, '影響度を入力してください'),
  })).min(1, '少なくとも1つの課題を入力してください'),
  painPoints: z.string().min(20, '困りごとは20文字以上で詳しく記載してください'),
  rootCause: z.string().optional(),
  solution: z.string().min(20, '解決策は20文字以上で記載してください'),
  approach: z.string().min(20, 'アプローチ方法は20文字以上で記載してください'),
  uniqueValue: z.string().optional(),
});

type PurposeBackgroundFormData = z.infer<typeof purposeBackgroundSchema>;

interface PurposeBackgroundStepProps {
  data: PurposeBackground;
  onComplete: (data: PurposeBackground) => void;
}

const ISSUE_CATEGORIES = [
  { value: 'sales', label: '売上・収益' },
  { value: 'efficiency', label: '業務効率' },
  { value: 'quality', label: '品質・サービス' },
  { value: 'hr', label: '人材・組織' },
  { value: 'marketing', label: 'マーケティング' },
  { value: 'technology', label: '技術・システム' },
  { value: 'other', label: 'その他' },
];

export function PurposeBackgroundStep({ data, onComplete }: PurposeBackgroundStepProps) {
  const [showLogicTree, setShowLogicTree] = useState(false);
  
  const form = useForm<PurposeBackgroundFormData>({
    resolver: zodResolver(purposeBackgroundSchema),
    defaultValues: {
      currentIssues: data.currentIssues?.length > 0 ? data.currentIssues : [
        { category: '', description: '', impact: '' }
      ],
      painPoints: data.painPoints || '',
      rootCause: data.rootCause || '',
      solution: data.solution || '',
      approach: data.approach || '',
      uniqueValue: data.uniqueValue || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'currentIssues',
  });

  const onSubmit = (formData: PurposeBackgroundFormData) => {
    // ロジックツリーの自動生成（簡易版）
    const logicTree = {
      id: 'root',
      type: 'issue' as const,
      content: '根本課題',
      children: formData.currentIssues.map((issue, idx) => ({
        id: `issue-${idx}`,
        type: 'cause' as const,
        content: issue.description,
        children: [{
          id: `solution-${idx}`,
          type: 'solution' as const,
          content: formData.solution,
        }]
      }))
    };

    onComplete({
      ...formData,
      logicTree: showLogicTree ? logicTree : undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 現状課題 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  現状課題
                </CardTitle>
                <CardDescription>
                  事業における現在の課題を具体的に記載してください
                </CardDescription>
              </div>
              <AIAssistantButton
                feature="issues"
                data={{
                  businessDescription: form.watch('painPoints'),
                  painPoints: form.watch('painPoints'),
                }}
                onApply={(result) => {
                  if (result.currentIssues) {
                    form.setValue('currentIssues', result.currentIssues);
                  }
                  if (result.rootCause) {
                    form.setValue('rootCause', result.rootCause);
                  }
                  if (result.recommendedSolution) {
                    form.setValue('solution', result.recommendedSolution);
                  }
                }}
                buttonText="AI分析"
                dialogTitle="課題分析"
                dialogDescription="AIが事業の課題を分析し、構造化します"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">課題 {index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`currentIssues.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>カテゴリ *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="カテゴリを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ISSUE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`currentIssues.${index}.impact`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>影響度 *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="例：売上20%減少" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`currentIssues.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>課題の詳細 *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="具体的な課題内容を記載してください..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ category: '', description: '', impact: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              課題を追加
            </Button>
          </CardContent>
        </Card>

        {/* 困りごと・痛み */}
        <FormField
          control={form.control}
          name="painPoints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>具体的な困りごと *</FormLabel>
              <FormDescription>
                現場で実際に困っていることを具体的に記載してください
              </FormDescription>
              <FormControl>
                <Textarea 
                  placeholder="例：手作業での在庫管理に毎日2時間かかり、ミスも月に数回発生している..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 根本原因 */}
        <FormField
          control={form.control}
          name="rootCause"
          render={({ field }) => (
            <FormItem>
              <FormLabel>根本原因分析</FormLabel>
              <FormDescription>
                なぜその課題が発生しているのか、根本的な原因を分析してください
              </FormDescription>
              <FormControl>
                <Textarea 
                  placeholder="例：システム化の遅れ、人材不足、プロセスの非効率性など..."
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 解決策 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              解決策
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="solution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>提案する解決策 *</FormLabel>
                  <FormDescription>
                    課題を解決するための具体的な施策を記載してください
                  </FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="例：クラウド型在庫管理システムの導入により、リアルタイム在庫管理と自動発注を実現..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="approach"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>アプローチ方法 *</FormLabel>
                  <FormDescription>
                    どのように解決策を実行するか、具体的な方法を記載してください
                  </FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="例：段階的導入、パイロット運用、全社展開の3フェーズで実施..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uniqueValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      独自性・差別化ポイント
                    </span>
                  </FormLabel>
                  <FormDescription>
                    他社と異なる独自の価値や強みがあれば記載してください
                  </FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="例：地域特性を活かした独自のサービス展開..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ロジックツリー表示オプション */}
        <Alert>
          <TreePine className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>課題と解決策のロジックツリーを自動生成できます</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLogicTree(!showLogicTree)}
            >
              {showLogicTree ? '無効化' : '有効化'}
            </Button>
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button type="submit">次へ進む</Button>
        </div>
      </form>
    </Form>
  );
}