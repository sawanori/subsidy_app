'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Plus,
  Trash2,
  GitBranch,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { GenerateResponse, ValidationResult } from '@/lib/api/types';

interface TaskDependency {
  taskId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF'; // Finish-Start, Start-Start, Finish-Finish, Start-Finish
  lag: number; // 遅延日数（負の値でリード）
}

interface WBSTask {
  id: string;
  wbsCode: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number;
  responsible?: string;
  resources?: string[];
  dependencies: TaskDependency[];
  progress: number;
  milestone: boolean;
  criticalPath: boolean;
  slack: number; // 余裕日数
  level: number; // WBS階層
  parentId?: string;
}

interface ScheduleData {
  tasks: WBSTask[];
  projectStartDate: string;
  projectEndDate: string;
  criticalPathLength: number;
  milestones: string[];
}

interface ScheduleFormProps {
  applicationId: string;
  data?: ScheduleData;
  onChange: (data: ScheduleData) => void;
  onValidate?: () => Promise<boolean>;
}

const DEPENDENCY_TYPES = [
  { value: 'FS', label: '終了-開始 (FS)' },
  { value: 'SS', label: '同時開始 (SS)' },
  { value: 'FF', label: '同時終了 (FF)' },
  { value: 'SF', label: '開始-終了 (SF)' },
];

const DEFAULT_RESOURCES = ['開発者', 'デザイナー', 'マネージャー', '外部委託'];

export function ScheduleForm({ applicationId, data, onChange, onValidate }: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleData>(
    data || {
      tasks: [],
      projectStartDate: new Date().toISOString().split('T')[0],
      projectEndDate: '',
      criticalPathLength: 0,
      milestones: [],
    }
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('wbs');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // クリティカルパス計算 (CPM)
  useEffect(() => {
    if (formData.tasks.length > 0) {
      calculateCriticalPath();
    }
  }, [formData.tasks]);

  const calculateCriticalPath = () => {
    const tasks = [...formData.tasks];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    // 初期化
    tasks.forEach((task) => {
      task.criticalPath = false;
      task.slack = 0;
    });

    // フォワードパス（最早開始・最早終了時刻）
    const earlyStart = new Map<string, number>();
    const earlyFinish = new Map<string, number>();

    const getTaskStart = (task: WBSTask): number => {
      if (earlyStart.has(task.id)) return earlyStart.get(task.id)!;

      let maxPrevFinish = 0;
      task.dependencies.forEach((dep) => {
        const prevTask = taskMap.get(dep.taskId);
        if (prevTask) {
          const prevFinish = getTaskFinish(prevTask);
          if (dep.type === 'FS') {
            maxPrevFinish = Math.max(maxPrevFinish, prevFinish + dep.lag);
          }
          // 他の依存タイプの処理も追加可能
        }
      });

      earlyStart.set(task.id, maxPrevFinish);
      return maxPrevFinish;
    };

    const getTaskFinish = (task: WBSTask): number => {
      if (earlyFinish.has(task.id)) return earlyFinish.get(task.id)!;

      const start = getTaskStart(task);
      const finish = start + task.duration;
      earlyFinish.set(task.id, finish);
      return finish;
    };

    // 全タスクの最早開始・終了を計算
    tasks.forEach((task) => {
      getTaskFinish(task);
    });

    // プロジェクト全体の最終日
    const projectFinish = Math.max(...tasks.map((t) => earlyFinish.get(t.id) || 0));

    // バックワードパス（最遅開始・最遅終了時刻）
    const lateStart = new Map<string, number>();
    const lateFinish = new Map<string, number>();

    // 末端タスクから逆算
    const calculateLateFinish = (task: WBSTask): number => {
      if (lateFinish.has(task.id)) return lateFinish.get(task.id)!;

      // 後続タスクを探す
      const successors = tasks.filter((t) =>
        t.dependencies.some((d) => d.taskId === task.id)
      );

      if (successors.length === 0) {
        // 末端タスク
        lateFinish.set(task.id, projectFinish);
        return projectFinish;
      }

      let minSuccessorStart = projectFinish;
      successors.forEach((successor) => {
        const successorLateStart = calculateLateStart(successor);
        const dep = successor.dependencies.find((d) => d.taskId === task.id);
        if (dep && dep.type === 'FS') {
          minSuccessorStart = Math.min(minSuccessorStart, successorLateStart - dep.lag);
        }
      });

      lateFinish.set(task.id, minSuccessorStart);
      return minSuccessorStart;
    };

    const calculateLateStart = (task: WBSTask): number => {
      if (lateStart.has(task.id)) return lateStart.get(task.id)!;

      const finish = calculateLateFinish(task);
      const start = finish - task.duration;
      lateStart.set(task.id, start);
      return start;
    };

    // 全タスクの最遅開始・終了を計算
    tasks.forEach((task) => {
      calculateLateStart(task);
    });

    // スラック（余裕）とクリティカルパスの判定
    tasks.forEach((task) => {
      const es = earlyStart.get(task.id) || 0;
      const ls = lateStart.get(task.id) || 0;
      task.slack = ls - es;
      task.criticalPath = task.slack === 0;
    });

    // クリティカルパス長を計算
    const criticalPathLength = projectFinish;

    const newData = {
      ...formData,
      tasks,
      criticalPathLength,
      projectEndDate: addDaysToDate(formData.projectStartDate, criticalPathLength),
    };
    setFormData(newData);
    onChange(newData);
  };

  const addDaysToDate = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
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

  const handleTaskChange = (index: number, field: keyof WBSTask, value: any) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };

    // 期間の自動計算
    if (field === 'startDate' || field === 'endDate') {
      const start = new Date(newTasks[index].startDate);
      const end = new Date(newTasks[index].endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      newTasks[index].duration = diffDays;
    }

    handleFieldChange('tasks', newTasks);
  };

  const addTask = (parentId?: string) => {
    const parentTask = parentId ? formData.tasks.find((t) => t.id === parentId) : null;
    const level = parentTask ? parentTask.level + 1 : 0;
    const parentWbs = parentTask ? parentTask.wbsCode : '';
    const siblingCount = formData.tasks.filter(
      (t) => t.parentId === parentId && t.level === level
    ).length;

    const newTask: WBSTask = {
      id: `task-${Date.now()}`,
      wbsCode: parentWbs ? `${parentWbs}.${siblingCount + 1}` : `${siblingCount + 1}`,
      name: '',
      startDate: formData.projectStartDate || new Date().toISOString().split('T')[0],
      endDate: addDaysToDate(formData.projectStartDate || new Date().toISOString().split('T')[0], 7),
      duration: 7,
      dependencies: [],
      progress: 0,
      milestone: false,
      criticalPath: false,
      slack: 0,
      level,
      parentId,
    };
    handleFieldChange('tasks', [...formData.tasks, newTask]);
  };

  const removeTask = (taskId: string) => {
    // 子タスクも同時に削除
    const tasksToRemove = new Set([taskId]);
    const findChildren = (parentId: string) => {
      formData.tasks
        .filter((t) => t.parentId === parentId)
        .forEach((child) => {
          tasksToRemove.add(child.id);
          findChildren(child.id);
        });
    };
    findChildren(taskId);

    const newTasks = formData.tasks.filter((t) => !tasksToRemove.has(t.id));
    handleFieldChange('tasks', newTasks);
  };

  const addDependency = (taskIndex: number) => {
    const task = formData.tasks[taskIndex];
    if (!task) return;

    const newDep: TaskDependency = {
      taskId: '',
      type: 'FS',
      lag: 0,
    };

    handleTaskChange(taskIndex, 'dependencies', [...task.dependencies, newDep]);
  };

  const updateDependency = (taskIndex: number, depIndex: number, field: keyof TaskDependency, value: any) => {
    const task = formData.tasks[taskIndex];
    if (!task) return;

    const newDeps = [...task.dependencies];
    newDeps[depIndex] = { ...newDeps[depIndex], [field]: value };
    handleTaskChange(taskIndex, 'dependencies', newDeps);
  };

  const removeDependency = (taskIndex: number, depIndex: number) => {
    const task = formData.tasks[taskIndex];
    if (!task) return;

    const newDeps = task.dependencies.filter((_, i) => i !== depIndex);
    handleTaskChange(taskIndex, 'dependencies', newDeps);
  };

  const toggleTaskExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      // スケジュール生成APIを呼び出し
      setGenerationProgress(30);
      const response = await apiClient.post<GenerateResponse>('/generate/schedule', {
        application_id: applicationId,
      });

      setGenerationProgress(70);

      // レスポンスをパース
      const generatedTasks = parseGeneratedSchedule(response.content);

      setGenerationProgress(90);

      // フォームデータを更新
      const newData: ScheduleData = {
        ...formData,
        tasks: generatedTasks,
      };

      setFormData(newData);
      onChange(newData);
      setGenerationProgress(100);

      setTimeout(() => {
        setGenerationProgress(0);
        setActiveTab('wbs');
      }, 1000);
    } catch (error: any) {
      setErrors({ generation: error.message || 'スケジュール生成に失敗しました' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async () => {
    try {
      const result = await apiClient.post<ValidationResult>('/validate/schedule', {
        tasks: formData.tasks,
        project_start: formData.projectStartDate,
        project_end: formData.projectEndDate,
      });
      setValidationResult(result);
    } catch (error: any) {
      setErrors({ validation: error.message || '検証に失敗しました' });
    }
  };

  const parseGeneratedSchedule = (content: string): WBSTask[] => {
    const tasks: WBSTask[] = [];
    const lines = content.split('\n');
    const taskIdMap = new Map<string, string>();
    
    for (const line of lines) {
      const wbsMatch = line.match(/^([\d.]+)\s+(.+)/);
      if (wbsMatch) {
        const wbsCode = wbsMatch[1];
        const name = wbsMatch[2];
        const level = (wbsCode.match(/\./g) || []).length;
        const parentWbs = wbsCode.split('.').slice(0, -1).join('.');
        const parentId = parentWbs ? taskIdMap.get(parentWbs) : undefined;
        
        const taskId = `task-${Date.now()}-${tasks.length}`;
        taskIdMap.set(wbsCode, taskId);
        
        tasks.push({
          id: taskId,
          wbsCode,
          name: name.replace(/[\[\]\uff3b\uff3d]/g, '').trim(),
          startDate: formData.projectStartDate || new Date().toISOString().split('T')[0],
          endDate: addDaysToDate(formData.projectStartDate || new Date().toISOString().split('T')[0], 7),
          duration: 7,
          dependencies: [],
          progress: 0,
          milestone: name.includes('マイルストーン') || name.includes('\u25c7'),
          criticalPath: false,
          slack: 0,
          level,
          parentId,
        });
      }
    }
    
    return tasks;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tasks || formData.tasks.length === 0) {
      newErrors.tasks = 'タスクを少なくとも1つ追加してください';
    }

    formData.tasks.forEach((task, index) => {
      if (!task.name) {
        newErrors[`task-${index}-name`] = 'タスク名は必須です';
      }
      if (new Date(task.endDate) < new Date(task.startDate)) {
        newErrors[`task-${index}-dates`] = '終了日は開始日より後に設定してください';
      }
    });

    // 循環依存のチェック
    const hasCyclicDependency = checkCyclicDependency();
    if (hasCyclicDependency) {
      newErrors.cyclic = '循環依存が検出されました';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkCyclicDependency = (): boolean => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = formData.tasks.find((t) => t.id === taskId);
      if (task) {
        for (const dep of task.dependencies) {
          if (!visited.has(dep.taskId)) {
            if (hasCycle(dep.taskId)) return true;
          } else if (recursionStack.has(dep.taskId)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const task of formData.tasks) {
      if (!visited.has(task.id)) {
        if (hasCycle(task.id)) return true;
      }
    }

    return false;
  };

  // タスクのツリー表示用にソート
  const sortedTasks = useMemo(() => {
    const sorted: WBSTask[] = [];
    const addTaskAndChildren = (parentId?: string) => {
      const children = formData.tasks.filter((t) => t.parentId === parentId);
      children.sort((a, b) => a.wbsCode.localeCompare(b.wbsCode));
      children.forEach((task) => {
        sorted.push(task);
        if (expandedTasks.has(task.id)) {
          addTaskAndChildren(task.id);
        }
      });
    };
    addTaskAndChildren(undefined);
    return sorted;
  }, [formData.tasks, expandedTasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          実施スケジュール
        </CardTitle>
        <CardDescription>
          プロジェクトのWBS（作業分解構造）とスケジュールを作成します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wbs">WBS編集</TabsTrigger>
            <TabsTrigger value="gantt">ガントチャート</TabsTrigger>
            <TabsTrigger value="generate">AI生成</TabsTrigger>
          </TabsList>

          <TabsContent value="wbs" className="space-y-6 mt-6">
            {/* プロジェクト基本情報 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="projectStartDate">プロジェクト開始日</Label>
                <Input
                  id="projectStartDate"
                  type="date"
                  value={formData.projectStartDate}
                  onChange={(e) => handleFieldChange('projectStartDate', e.target.value)}
                />
              </div>
              <div>
                <Label>プロジェクト終了日（自動計算）</Label>
                <Input value={formData.projectEndDate} disabled />
              </div>
              <div>
                <Label>クリティカルパス長</Label>
                <div className="flex items-center gap-2">
                  <Input value={`${formData.criticalPathLength}日`} disabled />
                  <Badge variant="destructive">重要</Badge>
                </div>
              </div>
            </div>

            {/* WBSタスクリスト */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>WBSタスク</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTask()}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  ルートタスク追加
                </Button>
              </div>

              <div className="border rounded-lg">
                {sortedTasks.map((task, index) => {
                  const originalIndex = formData.tasks.findIndex((t) => t.id === task.id);
                  const hasChildren = formData.tasks.some((t) => t.parentId === task.id);
                  const isExpanded = expandedTasks.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className={`border-b last:border-b-0 ${
                        task.criticalPath ? 'bg-destructive/5' : ''
                      }`}
                      style={{ paddingLeft: `${task.level * 24 + 16}px` }}
                    >
                      <div className="py-3 pr-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            {hasChildren && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleTaskExpand(task.id)}
                              >
                                {isExpanded ? '▼' : '▶'}
                              </Button>
                            )}
                            <Badge variant="outline" className="font-mono">
                              {task.wbsCode}
                            </Badge>
                            {task.milestone && <Badge variant="secondary">◇</Badge>}
                            {task.criticalPath && (
                              <Badge variant="destructive" className="text-xs">
                                CP
                              </Badge>
                            )}
                          </div>

                          <div className="flex-1 grid grid-cols-6 gap-2">
                            <div className="col-span-2">
                              <Input
                                value={task.name}
                                onChange={(e) => handleTaskChange(originalIndex, 'name', e.target.value)}
                                placeholder="タスク名"
                                className={`h-8 ${errors[`task-${originalIndex}-name`] ? 'border-destructive' : ''}`}
                              />
                            </div>
                            <div>
                              <Input
                                type="date"
                                value={task.startDate}
                                onChange={(e) => handleTaskChange(originalIndex, 'startDate', e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Input
                                type="date"
                                value={task.endDate}
                                onChange={(e) => handleTaskChange(originalIndex, 'endDate', e.target.value)}
                                className={`h-8 ${errors[`task-${originalIndex}-dates`] ? 'border-destructive' : ''}`}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={task.progress}
                                onChange={(e) =>
                                  handleTaskChange(originalIndex, 'progress', parseInt(e.target.value) || 0)
                                }
                                className="h-8"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm">%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {task.slack > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  余裕{task.slack}日
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => addTask(task.id)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => removeTask(task.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* 依存関係 */}
                        {selectedTaskId === task.id && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="space-y-2">
                              <Label className="text-xs">依存関係</Label>
                              {task.dependencies.map((dep, depIndex) => (
                                <div key={depIndex} className="flex items-center gap-2">
                                  <Select
                                    value={dep.taskId}
                                    onValueChange={(value) =>
                                      updateDependency(originalIndex, depIndex, 'taskId', value)
                                    }
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="先行タスク" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {formData.tasks
                                        .filter((t) => t.id !== task.id)
                                        .map((t) => (
                                          <SelectItem key={t.id} value={t.id}>
                                            {t.wbsCode} {t.name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={dep.type}
                                    onValueChange={(value) =>
                                      updateDependency(originalIndex, depIndex, 'type', value)
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {DEPENDENCY_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="number"
                                    value={dep.lag}
                                    onChange={(e) =>
                                      updateDependency(
                                        originalIndex,
                                        depIndex,
                                        'lag',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    placeholder="遅延"
                                    className="h-8 w-20"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDependency(originalIndex, depIndex)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addDependency(originalIndex)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                依存追加
                              </Button>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
                        >
                          <GitBranch className="h-3 w-3 mr-1" />
                          依存関係
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.tasks && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.tasks}</AlertDescription>
                </Alert>
              )}

              {errors.cyclic && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errors.cyclic}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* クリティカルパス情報 */}
            {formData.tasks.some((t) => t.criticalPath) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">クリティカルパス：</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tasks
                      .filter((t) => t.criticalPath)
                      .map((t) => (
                        <Badge key={t.id} variant="destructive">
                          {t.wbsCode} {t.name}
                        </Badge>
                      ))}
                  </div>
                  <p className="text-xs mt-2">
                    これらのタスクが遅延するとプロジェクト全体が遅延します
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* 検証ボタン */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleValidate}
                disabled={formData.tasks.length === 0}
              >
                <Clock className="h-4 w-4 mr-2" />
                スケジュールを検証
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

          <TabsContent value="gantt" className="mt-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                ガントチャート表示機能は別コンポーネントで実装予定です。
                WBS編集画面でタスクを入力してください。
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6 mt-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                AIが事業内容に基づいて適切なWBSとスケジュールを自動生成します。
                生成後は手動で編集可能です。
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {!isGenerating && (
                <Button onClick={handleAutoGenerate} className="w-full gap-2" size="lg">
                  <Sparkles className="h-4 w-4" />
                  WBS・スケジュールを自動生成
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
                    {generationProgress >= 30 && generationProgress < 70 && 'WBSを構築中...'}
                    {generationProgress >= 70 && generationProgress < 90 && 'スケジュールを最適化中...'}
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
                  <p className="font-medium">生成されるスケジュールの特徴：</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>適切なWBS階層構造（レベル2-3）</li>
                    <li>依存関係の自動設定</li>
                    <li>クリティカルパスの特定</li>
                    <li>マイルストーンの適切な配置</li>
                    <li>現実的な期間設定</li>
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