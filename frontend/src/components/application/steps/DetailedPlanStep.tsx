'use client';

import { useFieldArray, useForm } from 'react-hook-form';
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
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  ArrowUpDown,
  Calendar,
  Users,
  MapPin,
  HelpCircle,
  Target,
  Clock
} from 'lucide-react';
import type { DetailedPlan, Priority } from '@/types/application-extended';

const detailedPlanSchema = z.object({
  plans: z.array(z.object({
    what: z.string().min(5, '何をするか、5文字以上で入力してください'),
    why: z.string().min(5, 'なぜ必要か、5文字以上で入力してください'),
    who: z.string().min(2, '誰が担当するか入力してください'),
    where: z.string().min(2, 'どこで実施するか入力してください'),
    when: z.string().min(2, 'いつまでに実施するか入力してください'),
    how: z.string().min(10, 'どのように実施するか、10文字以上で入力してください'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    category: z.string().min(1, 'カテゴリを入力してください'),
    expectedResult: z.string().min(10, '期待される成果を10文字以上で入力してください'),
    prerequisite: z.string().optional(),
  })).min(1, '少なくとも1つの計画を入力してください'),
});

type DetailedPlanFormData = z.infer<typeof detailedPlanSchema>;

interface DetailedPlanStepProps {
  data: DetailedPlan[];
  onComplete: (data: DetailedPlan[]) => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW', label: '低', color: 'bg-gray-500' },
  { value: 'MEDIUM', label: '中', color: 'bg-yellow-500' },
  { value: 'HIGH', label: '高', color: 'bg-orange-500' },
  { value: 'CRITICAL', label: '最重要', color: 'bg-red-500' },
];

const PLAN_CATEGORIES = [
  'システム導入',
  'プロセス改善',
  '人材育成',
  'マーケティング',
  '設備投資',
  '研究開発',
  '品質向上',
  'コスト削減',
  'その他',
];

export function DetailedPlanStep({ data, onComplete }: DetailedPlanStepProps) {
  const form = useForm<DetailedPlanFormData>({
    resolver: zodResolver(detailedPlanSchema),
    defaultValues: {
      plans: data?.length > 0 ? data : [{
        what: '',
        why: '',
        who: '',
        where: '',
        when: '',
        how: '',
        priority: 'MEDIUM' as Priority,
        category: '',
        expectedResult: '',
        prerequisite: '',
      }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'plans',
  });

  const onSubmit = (formData: DetailedPlanFormData) => {
    const plansWithIndex = formData.plans.map((plan, index) => ({
      ...plan,
      orderIndex: index,
    }));
    onComplete(plansWithIndex);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      move(index, index - 1);
    } else if (direction === 'down' && index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    取組内容 {index + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUpDown className="h-4 w-4 rotate-180" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === fields.length - 1}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* カテゴリと優先度 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`plans.${index}.category`}
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
                            {PLAN_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
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
                    name={`plans.${index}.priority`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>優先度 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="優先度を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${option.color}`} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 5W1H セクション */}
                <div className="space-y-4 border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-sm text-gray-600">5W1H</h4>
                  
                  {/* What - 何を */}
                  <FormField
                    control={form.control}
                    name={`plans.${index}.what`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          What - 何を *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="例：クラウド型在庫管理システムを導入する"
                            className="min-h-[60px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Why - なぜ */}
                  <FormField
                    control={form.control}
                    name={`plans.${index}.why`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Why - なぜ *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="例：在庫管理の効率化とミス削減のため"
                            className="min-h-[60px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Who - 誰が */}
                    <FormField
                      control={form.control}
                      name={`plans.${index}.who`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Who - 誰が *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例：IT推進室、外部ベンダー"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Where - どこで */}
                    <FormField
                      control={form.control}
                      name={`plans.${index}.where`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Where - どこで *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例：本社倉庫、全拠点"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* When - いつまでに */}
                  <FormField
                    control={form.control}
                    name={`plans.${index}.when`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          When - いつまでに *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例：2025年3月末まで"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* How - どのように */}
                  <FormField
                    control={form.control}
                    name={`plans.${index}.how`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          How - どのように *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="例：段階的導入（第1フェーズ：要件定義、第2フェーズ：システム選定、第3フェーズ：導入・運用）"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 期待される成果 */}
                <FormField
                  control={form.control}
                  name={`plans.${index}.expectedResult`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>期待される成果 *</FormLabel>
                      <FormDescription>
                        この取組により期待される具体的な成果を記載してください
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="例：在庫管理時間を50%削減、在庫ミスをゼロに"
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 前提条件 */}
                <FormField
                  control={form.control}
                  name={`plans.${index}.prerequisite`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>前提条件</FormLabel>
                      <FormDescription>
                        実施にあたっての前提条件があれば記載してください
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder="例：社内ネットワークの整備完了"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => append({
            what: '',
            why: '',
            who: '',
            where: '',
            when: '',
            how: '',
            priority: 'MEDIUM',
            category: '',
            expectedResult: '',
            prerequisite: '',
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          取組内容を追加
        </Button>

        <div className="flex justify-end">
          <Button type="submit">次へ進む</Button>
        </div>
      </form>
    </Form>
  );
}