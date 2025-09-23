'use client';

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2,
  TrendingUp,
  BarChart3,
  Users,
  DollarSign,
  Target,
  Activity,
  Calculator
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { KpiTarget, KpiCategory, ChartType } from '@/types/application-extended';
import { KPI_CATEGORIES } from '@/types/application-extended';

const kpiTargetSchema = z.object({
  kpiTargets: z.array(z.object({
    category: z.string().min(1, 'カテゴリを選択してください'),
    metric: z.string().min(1, '指標名を入力してください'),
    unit: z.string().min(1, '単位を入力してください'),
    currentValue: z.number().min(0, '現在値を入力してください'),
    year1Target: z.number().min(0, '1年目目標を入力してください'),
    year2Target: z.number().optional(),
    year3Target: z.number().optional(),
    formula: z.string().optional(),
    chartType: z.string(),
  })).min(1, '少なくとも1つのKPIを設定してください'),
});

type KpiTargetFormData = z.infer<typeof kpiTargetSchema>;

interface KPITargetStepProps {
  data: KpiTarget[];
  onComplete: (data: KpiTarget[]) => void;
}

const CHART_TYPES: { value: ChartType; label: string; icon: any }[] = [
  { value: 'LINE', label: '折れ線グラフ', icon: TrendingUp },
  { value: 'BAR', label: '棒グラフ', icon: BarChart3 },
  { value: 'AREA', label: 'エリアチャート', icon: Activity },
  { value: 'GAUGE', label: 'ゲージ', icon: Target },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'SALES': return DollarSign;
    case 'CUSTOMERS': return Users;
    case 'CONVERSION': return Target;
    default: return Activity;
  }
};

export function KPITargetStep({ data, onComplete }: KPITargetStepProps) {
  const [activeTab, setActiveTab] = useState('0');
  
  const form = useForm<KpiTargetFormData>({
    resolver: zodResolver(kpiTargetSchema),
    defaultValues: {
      kpiTargets: data?.length > 0 ? data : [{
        category: 'SALES',
        metric: '',
        unit: '円',
        currentValue: 0,
        year1Target: 0,
        year2Target: undefined,
        year3Target: undefined,
        formula: '',
        chartType: 'LINE',
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'kpiTargets',
  });

  const onSubmit = (formData: KpiTargetFormData) => {
    const kpiWithOrder = formData.kpiTargets.map((kpi, index) => ({
      ...kpi,
      category: kpi.category as KpiCategory,
      chartType: kpi.chartType as ChartType,
      displayOrder: index,
    }));
    onComplete(kpiWithOrder);
  };

  const calculateGrowthRate = (current: number, target: number) => {
    if (current === 0) return 0;
    return ((target - current) / current * 100).toFixed(1);
  };

  const getDefaultUnit = (category: string) => {
    switch (category) {
      case 'SALES': return '円';
      case 'CUSTOMERS': return '人';
      case 'UNIT_PRICE': return '円';
      case 'CONVERSION': return '%';
      case 'RETENTION': return '%';
      case 'EFFICIENCY': return '時間';
      case 'QUALITY': return '件';
      default: return '';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>数値目標（KPI）設定</CardTitle>
            <CardDescription>
              事業の成果を測定するための具体的な数値目標を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${fields.length}, 1fr)` }}>
                {fields.map((field, index) => {
                  const category = form.watch(`kpiTargets.${index}.category`);
                  const Icon = getCategoryIcon(category);
                  return (
                    <TabsTrigger key={field.id} value={index.toString()}>
                      <Icon className="h-4 w-4 mr-1" />
                      KPI {index + 1}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {fields.map((field, index) => {
                const currentValue = form.watch(`kpiTargets.${index}.currentValue`) || 0;
                const year1Target = form.watch(`kpiTargets.${index}.year1Target`) || 0;
                const year2Target = form.watch(`kpiTargets.${index}.year2Target`) || 0;
                const year3Target = form.watch(`kpiTargets.${index}.year3Target`) || 0;

                return (
                  <TabsContent key={field.id} value={index.toString()} className="space-y-4">
                    <div className="flex justify-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            remove(index);
                            if (parseInt(activeTab) >= fields.length - 1) {
                              setActiveTab('0');
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          このKPIを削除
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* カテゴリ */}
                      <FormField
                        control={form.control}
                        name={`kpiTargets.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>KPIカテゴリ *</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // カテゴリに応じて単位を自動設定
                                form.setValue(`kpiTargets.${index}.unit`, getDefaultUnit(value));
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="カテゴリを選択" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {KPI_CATEGORIES.map(cat => (
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

                      {/* 指標名 */}
                      <FormField
                        control={form.control}
                        name={`kpiTargets.${index}.metric`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>指標名 *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="例：月間売上高、新規顧客数" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      {/* 単位 */}
                      <FormField
                        control={form.control}
                        name={`kpiTargets.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>単位 *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="例：円、人、%" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 現在値 */}
                      <FormField
                        control={form.control}
                        name={`kpiTargets.${index}.currentValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>現在値 *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* グラフタイプ */}
                      <FormField
                        control={form.control}
                        name={`kpiTargets.${index}.chartType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>表示形式</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CHART_TYPES.map(type => {
                                  const Icon = type.icon;
                                  return (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        {type.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 年次目標 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">年次目標値</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`kpiTargets.${index}.year1Target`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>1年目目標 *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0" 
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                {currentValue > 0 && year1Target > 0 && (
                                  <p className="text-sm text-green-600">
                                    成長率: +{calculateGrowthRate(currentValue, year1Target)}%
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`kpiTargets.${index}.year2Target`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>2年目目標</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0" 
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                {year1Target > 0 && year2Target > 0 && (
                                  <p className="text-sm text-green-600">
                                    成長率: +{calculateGrowthRate(year1Target, year2Target)}%
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`kpiTargets.${index}.year3Target`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>3年目目標</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0" 
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                {year2Target > 0 && year3Target > 0 && (
                                  <p className="text-sm text-green-600">
                                    成長率: +{calculateGrowthRate(year2Target, year3Target)}%
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* 進捗プレビュー */}
                        {currentValue > 0 && year1Target > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>目標達成率（現在→1年目）</span>
                              <span>{((currentValue / year1Target) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={(currentValue / year1Target) * 100} />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 計算式 */}
                    <FormField
                      control={form.control}
                      name={`kpiTargets.${index}.formula`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            計算式・前提条件
                          </FormLabel>
                          <FormDescription>
                            KPIの計算方法や前提条件があれば記載してください
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="例：売上 = 客数 × 客単価 × リピート率"
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            append({
              category: 'CUSTOM',
              metric: '',
              unit: '',
              currentValue: 0,
              year1Target: 0,
              year2Target: undefined,
              year3Target: undefined,
              formula: '',
              chartType: 'LINE',
            });
            setActiveTab(fields.length.toString());
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          KPIを追加
        </Button>

        <div className="flex justify-end">
          <Button type="submit">次へ進む</Button>
        </div>
      </form>
    </Form>
  );
}