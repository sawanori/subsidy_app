import { Injectable } from '@nestjs/common';
import { KPIItemDto } from '../dto/auto-plan.dto';

interface GenerateInput {
  baselines: Record<string, { value: number | null; source: string | null; confidence: number }>;
  intents: Array<{ text: string; tags: string[]; themes?: string[] }>;
  constraints?: { months?: number; budget_max?: number };
  prefer?: { kpi_count?: number };
}

@Injectable()
export class KPIGeneratorService {
  generate(input: GenerateInput): KPIItemDto[] {
    const months = input.constraints?.months ?? 6;
    const kpiCount = input.prefer?.kpi_count ?? 4;

    const salesMonthly = input.baselines.sales_monthly?.value ?? 1_000_000;
    const baselineCVR = 1.2; // % 仮値

    // 期間に応じた上限（簡易）
    const growthCap = months <= 3 ? 0.3 : months <= 6 ? 0.7 : 1.2;

    const kpis: KPIItemDto[] = [];
    kpis.push({
      name: 'CVR',
      baseline: Number(baselineCVR.toFixed(1)),
      target: Number((baselineCVR + 0.6 * Math.min(1, months / 6)).toFixed(1)),
      unit: '%',
      method: 'GA4',
      frequency: 'monthly',
      rationale: `期間${months}ヶ月、CVRは絶対上昇幅で制限`,
      sourceRef: 'baseline:assumed',
    });

    const newAcqBaseline = Math.round(salesMonthly / 10000); // 仮：売上/月の割り算で件数近似
    const newAcqTarget = Math.round(newAcqBaseline * (1 + Math.min(growthCap, 0.6)));
    kpis.push({
      name: '新規獲得数',
      baseline: newAcqBaseline,
      target: newAcqTarget,
      unit: '件/月',
      method: 'GA4',
      frequency: 'monthly',
      rationale: `件数系は成長率上限 ${Math.round(growthCap * 100)}% を適用`,
      sourceRef: 'tax:sales_monthly',
    });

    const roasBaseline = 300; // % 仮値
    const roasTarget = Math.round(roasBaseline * (1 + Math.min(growthCap, 0.4)));
    kpis.push({
      name: 'ROAS',
      baseline: roasBaseline,
      target: roasTarget,
      unit: '%',
      method: '広告管理',
      frequency: 'monthly',
      rationale: '広告最適化により効率改善を想定',
      sourceRef: 'baseline:assumed',
    });

    // 必要に応じて4つ目以降を追加
    if (kpiCount > kpis.length) {
      kpis.push({
        name: 'リピート率',
        baseline: 20,
        target: 25,
        unit: '%',
        method: 'CRM',
        frequency: 'monthly',
        rationale: 'LTV向上施策の効果を反映',
        sourceRef: 'baseline:assumed',
      });
    }

    return kpis.slice(0, kpiCount);
  }
}

