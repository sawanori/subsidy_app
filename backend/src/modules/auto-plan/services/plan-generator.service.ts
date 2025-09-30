import { Injectable } from '@nestjs/common';
import { AIAssistantService } from '@modules/ai-assistant/services/ai-assistant.service';

@Injectable()
export class PlanGeneratorService {
  constructor(private readonly ai: AIAssistantService) {}

  async generate(input: {
    baselines: Record<string, any>;
    intents: Array<{ text: string; tags: string[]; themes?: string[] }>;
    kpis: Array<{ name: string; baseline?: number; target: number; unit: string; method: string; frequency: string; rationale?: string; sourceRef?: string }>;
    constraints?: { months?: number; budget_max?: number };
  }) {
    const months = input.constraints?.months ?? 6;

    // OpenAI 未設定時はモックにフォールバック（AIAssistantService 内で対応済み）
    const promptVars = {
      businessPlan: JSON.stringify({ intents: input.intents, baselines: input.baselines, months, kpis: input.kpis }),
      implementationPeriod: `${months}ヶ月`,
      mainActivities: input.intents.map(i => i.text).join('\n') || '計画立案',
    } as any;

    try {
      const resp = await this.ai.generateGantt({
        businessPlan: promptVars.businessPlan,
        implementationPeriod: promptVars.implementationPeriod,
        mainActivities: input.intents.map(i => i.text),
      });

      // ここでは簡易的に固定骨子を返す（モック/本実装問わず）
      const plan = {
        background: '市場動向と現状課題の整理（引用2本以内）',
        solution: {
          themes: [
            { name: 'CVR改善', measures: [{ name: 'UI/UX改善', tasks: ['フォーム簡略化', 'ABテスト'] }] },
            { name: '新規獲得', measures: [{ name: '広告最適化', tasks: ['P-MAX見直し'] }] },
          ],
        },
        schedule: {
          wbs: [
            { task: 'ABテスト設計', start: '2025-10-01', end: '2025-10-10' },
            { task: '広告配信最適化', start: '2025-10-05', end: '2025-10-20' },
          ],
        },
        citations: [ { type: 'source' as const, id: 'tax:src_abc' } ],
      };

      return plan;
    } catch {
      return {
        background: '（モック）市場動向と現状課題の整理',
        solution: {
          themes: [
            { name: 'CVR改善', measures: [{ name: 'UI/UX改善', tasks: ['フォーム簡略化'] }] },
          ],
        },
        schedule: { wbs: [{ task: '計画立案', start: '2025-10-01', end: '2025-10-07' }] },
        citations: [],
      };
    }
  }
}

