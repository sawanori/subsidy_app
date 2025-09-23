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
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Trash2,
  Calendar,
  Flag,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import type { GanttTask, TaskType } from '@/types/application-extended';

const ganttTaskSchema = z.object({
  tasks: z.array(z.object({
    taskName: z.string().min(1, 'タスク名を入力してください'),
    taskType: z.enum(['PHASE', 'TASK', 'SUBTASK', 'MILESTONE']),
    startDate: z.string().min(1, '開始日を入力してください'),
    endDate: z.string().min(1, '終了日を入力してください'),
    assignee: z.string().min(1, '担当者を入力してください'),
    progress: z.number().min(0).max(100),
    milestone: z.boolean(),
  })).min(1, '少なくとも1つのタスクを追加してください'),
});

type GanttTaskFormData = z.infer<typeof ganttTaskSchema>;

interface GanttChartStepProps {
  data: GanttTask[];
  onComplete: (data: GanttTask[]) => void;
}

const TASK_TYPES: { value: TaskType; label: string; color: string }[] = [
  { value: 'PHASE', label: 'フェーズ', color: 'bg-purple-500' },
  { value: 'TASK', label: 'タスク', color: 'bg-blue-500' },
  { value: 'SUBTASK', label: 'サブタスク', color: 'bg-green-500' },
  { value: 'MILESTONE', label: 'マイルストーン', color: 'bg-red-500' },
];

export function GanttChartStep({ data, onComplete }: GanttChartStepProps) {
  const form = useForm<GanttTaskFormData>({
    resolver: zodResolver(ganttTaskSchema),
    defaultValues: {
      tasks: data?.length > 0 ? data.map(task => ({
        taskName: task.taskName,
        taskType: task.taskType,
        startDate: typeof task.startDate === 'string' ? task.startDate : '',
        endDate: typeof task.endDate === 'string' ? task.endDate : '',
        assignee: task.assignee,
        progress: task.progress,
        milestone: task.milestone,
      })) : [{
        taskName: '',
        taskType: 'TASK' as TaskType,
        startDate: '',
        endDate: '',
        assignee: '',
        progress: 0,
        milestone: false,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });

  const onSubmit = (formData: GanttTaskFormData) => {
    const tasksWithDetails = formData.tasks.map((task, index) => ({
      ...task,
      description: '',
      duration: calculateDuration(task.startDate, task.endDate),
      dependencies: [],
      parentTaskId: undefined,
      assigneeRole: '',
      resources: {},
      color: TASK_TYPES.find(t => t.value === task.taskType)?.color.replace('bg-', '#'),
      critical: false,
      orderIndex: index,
    }));
    onComplete(tasksWithDetails);
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case 'MILESTONE': return Flag;
      case 'PHASE': return Calendar;
      default: return CheckCircle2;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>実施スケジュール（簡易版）</CardTitle>
            <CardDescription>
              プロジェクトの主要なタスクとスケジュールを設定してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const progress = form.watch(`tasks.${index}.progress`);
              const taskType = form.watch(`tasks.${index}.taskType`);
              const Icon = getTaskIcon(taskType);
              
              return (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="absolute top-2 right-2">
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

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">タスク {index + 1}</span>
                        <Badge variant="outline">
                          {TASK_TYPES.find(t => t.value === taskType)?.label}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`tasks.${index}.taskName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>タスク名 *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="例：システム要件定義" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`tasks.${index}.taskType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>タスクタイプ *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TASK_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${type.color}`} />
                                        {type.label}
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

                      <div className="grid md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`tasks.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>開始日 *</FormLabel>
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
                          name={`tasks.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>終了日 *</FormLabel>
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
                          name={`tasks.${index}.assignee`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>担当者 *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="例：山田太郎" 
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
                        name={`tasks.${index}.progress`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>進捗率: {progress}%</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input 
                                  type="range" 
                                  min="0"
                                  max="100"
                                  step="5"
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                                <Progress value={progress} className="h-2" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`tasks.${index}.milestone`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">
                              マイルストーンとして設定
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      {form.watch(`tasks.${index}.milestone`) && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            重要な節目として設定されています
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({
                taskName: '',
                taskType: 'TASK',
                startDate: '',
                endDate: '',
                assignee: '',
                progress: 0,
                milestone: false,
              })}
            >
              <Plus className="mr-2 h-4 w-4" />
              タスクを追加
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">次へ進む</Button>
        </div>
      </form>
    </Form>
  );
}