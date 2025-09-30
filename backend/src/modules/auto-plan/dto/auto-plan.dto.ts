export interface BaselineBuildRequestDto {
  application_id: string;
}

export interface BaselineValue {
  value: number | null;
  source: string | null;
  confidence: number; // 0-1
  note?: string;
}

export interface BaselineBuildResponseDto {
  baselines: Record<string, BaselineValue>;
}

export interface AutoPlanRequestDto {
  application_id: string;
  initiatives: { text: string; tags: string[] }[];
  constraints?: { months?: number; budget_max?: number };
  prefer?: { kpi_count?: number };
}

export interface KPIItemDto {
  name: string;
  baseline?: number;
  target: number;
  unit: string;
  method: string;
  frequency: string;
  rationale?: string;
  sourceRef?: string;
}

export interface AutoPlanResponseDto {
  kpis: KPIItemDto[];
  plan: {
    background: string;
    solution: { themes: Array<{ name: string; measures: Array<{ name: string; tasks: string[] }> }> };
    schedule: { wbs: Array<{ task: string; start: string; end: string }> };
    citations?: Array<{ type: 'source' | 'evidence'; id: string }>;
  };
  citations: Array<{ type: 'source' | 'evidence'; id: string }>;
  warnings?: any[];
  fixes?: any[];
}

export interface ValidateKpisRequestDto {
  kpis: KPIItemDto[];
  constraints?: { months?: number };
}

export interface ValidateKpisResponseDto {
  ok: boolean;
  warnings: Array<{ code: string; message: string; kpi?: string }>;
  fixes: Array<{ type: string; message: string; kpi?: string; suggestion?: any }>;
}

export interface ValidateTextRequestDto {
  field: 'background' | 'solution' | 'schedule' | 'summary';
  text: string;
  ruleset?: string;
}

export interface ValidateTextResponseDto {
  ok: boolean;
  errors: Array<{ code: string; at?: string; message: string }>;
  fixes: Array<{ type: 'summarize' | 'bulletize' | 'shorten'; new_text: string }>;
}

