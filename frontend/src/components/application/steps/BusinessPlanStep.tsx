'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const businessPlanSchema = z.object({
  projectTitle: z.string().min(1, 'プロジェクト名を入力してください'),
  projectDescription: z.string().min(50, '事業内容は50文字以上で詳しく記載してください'),
  requestedAmount: z.number().min(1, '補助金申請額を入力してください').max(2000000, '補助金申請額は200万円以下にしてください'),
  totalProjectCost: z.number().min(1, '総事業費を入力してください'),
  implementationPeriod: z.object({
    start: z.string().min(1, '開始日を入力してください'),
    end: z.string().min(1, '終了日を入力してください'),
  }),
  expectedEffects: z.string().min(30, '期待される効果を30文字以上で記載してください'),
  salesTarget: z.object({
    year1: z.number().min(0, '1年目の売上目標を入力してください'),
    year2: z.number().min(0, '2年目の売上目標を入力してください'),
    year3: z.number().min(0, '3年目の売上目標を入力してください'),
  }),
});

type BusinessPlanFormData = z.infer<typeof businessPlanSchema>;

interface BusinessPlanStepProps {
  data: BusinessPlanFormData;
  onComplete: (data: BusinessPlanFormData) => void;
}

export function BusinessPlanStep({ data, onComplete }: BusinessPlanStepProps) {
  const form = useForm<BusinessPlanFormData>({
    resolver: zodResolver(businessPlanSchema),
    defaultValues: data,
  });

  const onSubmit = (formData: BusinessPlanFormData) => {
    onComplete(formData);
  };

  const requestedAmount = form.watch('requestedAmount');
  const totalProjectCost = form.watch('totalProjectCost');
  const subsidyRate = totalProjectCost > 0 ? (requestedAmount / totalProjectCost * 100).toFixed(1) : '0';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="projectTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>補助事業名 *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="例：ECサイト構築による販路拡大事業" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>事業内容 *</FormLabel>
              <FormDescription>
                補助事業の具体的な内容を詳しく記載してください（最低50文字）
              </FormDescription>
              <FormControl>
                <Textarea 
                  placeholder="事業の背景、実施内容、期待される成果などを具体的に記載してください..."
                  className="min-h-[150px]"
                  {...field} 
                />
              </FormControl>
              <div className="text-sm text-gray-500 mt-1">
                {field.value?.length || 0} 文字
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">補助金申請額</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requestedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>補助金申請額（円） *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1000000" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      上限：200万円
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalProjectCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>総事業費（円） *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1500000" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      補助率：{subsidyRate}%（通常2/3以内）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">事業実施期間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="implementationPeriod.start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始予定日 *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="implementationPeriod.end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>終了予定日 *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="expectedEffects"
          render={({ field }) => (
            <FormItem>
              <FormLabel>期待される効果 *</FormLabel>
              <FormDescription>
                補助事業実施により期待される効果を具体的に記載してください
              </FormDescription>
              <FormControl>
                <Textarea 
                  placeholder="売上増加、新規顧客獲得、業務効率化など..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">売上目標</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salesTarget.year1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1年目（万円） *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1000" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salesTarget.year2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2年目（万円） *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1500" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salesTarget.year3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3年目（万円） *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2000" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">次へ進む</Button>
        </div>
      </form>
    </Form>
  );
}