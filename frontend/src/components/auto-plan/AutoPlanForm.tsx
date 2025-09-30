'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EditableKPICard } from './EditableKPICard';

interface KPI {
  name: string;
  baseline?: number;
  target: number;
  unit: string;
  method: string;
  frequency: string;
  rationale?: string;
  sourceRef?: string;
}

interface AutoPlanResponse {
  kpis: KPI[];
  plan: {
    background: string;
    solution: {
      themes: Array<{
        name: string;
        measures: Array<{
          name: string;
          tasks: string[];
        }>;
      }>;
    };
    schedule: {
      wbs: Array<{
        task: string;
        start: string;
        end: string;
      }>;
    };
  };
  warnings?: any[];
  fixes?: any[];
}

export function AutoPlanForm({ applicationId }: { applicationId: string }) {
  const [initiatives, setInitiatives] = useState('');
  const [months, setMonths] = useState(6);
  const [budgetMax, setBudgetMax] = useState(1500000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AutoPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedKpis, setEditedKpis] = useState<KPI[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build baseline first
      const baselineRes = await fetch('http://localhost:3001/v1/baseline/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      });

      if (!baselineRes.ok) throw new Error('ベースライン構築に失敗しました');

      // Generate KPIs and Plan
      const planRes = await fetch('http://localhost:3001/v1/plan/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          initiatives: [{
            text: initiatives,
            tags: initiatives.split(/[\s、,]+/).filter(t => t.length > 0).slice(0, 5),
          }],
          constraints: { months, budget_max: budgetMax },
          prefer: { kpi_count: 4 },
        }),
      });

      if (!planRes.ok) throw new Error('KPI生成に失敗しました');

      const data = await planRes.json();
      setResult(data);
      setEditedKpis(data.kpis || []);
    } catch (err: any) {
      setError(err.message || '生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            KPI・事業計画 自動生成
          </CardTitle>
          <CardDescription>
            取組内容を入力すると、確定申告データから現状を推定し、KPIと事業計画を自動生成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="initiatives">取組内容</Label>
            <Textarea
              id="initiatives"
              value={initiatives}
              onChange={(e) => setInitiatives(e.target.value)}
              placeholder="例: ECサイトのCVR改善と新規顧客獲得強化"
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="months">実施期間（月）</Label>
              <Input
                id="months"
                type="number"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                min={1}
                max={12}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="budget">予算上限（円）</Label>
              <Input
                id="budget"
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                min={0}
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !initiatives}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                KPI・計画を自動生成
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          {/* KPI Display */}
          <Card>
            <CardHeader>
              <CardTitle>生成されたKPI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {editedKpis.map((kpi, index) => (
                  <EditableKPICard
                    key={index}
                    kpi={kpi}
                    index={index}
                    onUpdate={(idx, updatedKpi) => {
                      const newKpis = [...editedKpis];
                      newKpis[idx] = updatedKpi;
                      setEditedKpis(newKpis);
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan Display */}
          <Card>
            <CardHeader>
              <CardTitle>事業計画概要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">背景</h4>
                <p className="text-sm">{result.plan.background}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">解決策</h4>
                {result.plan.solution.themes.map((theme, i) => (
                  <div key={i} className="ml-4 mb-3">
                    <h5 className="font-medium">{theme.name}</h5>
                    {theme.measures.map((measure, j) => (
                      <div key={j} className="ml-4 text-sm">
                        <span className="text-muted-foreground">• {measure.name}: </span>
                        {measure.tasks.join(', ')}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold mb-2">スケジュール</h4>
                <div className="space-y-1">
                  {result.plan.schedule.wbs.map((task, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium">{task.task}</span>
                      <span className="text-muted-foreground ml-2">
                        ({task.start} 〜 {task.end})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">検証結果</div>
                {result.warnings.map((w: any, i: number) => (
                  <div key={i} className="text-sm">• {w.message}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}