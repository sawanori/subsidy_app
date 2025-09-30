// OpenAPI型定義（自動生成用）
// openapi.yamlから生成される型を管理

export interface HealthCheckResponse {
  status: 'healthy';
  timestamp: string;
  version: string;
}

export interface IntakeResponse {
  file_id: string;
  sha256: string;
  mime_type: string;
  size: number;
  status: 'uploaded' | 'scanning' | 'ready' | 'rejected';
}

export interface ExtractResponse {
  extraction_id: string;
  file_id: string;
  document_type: 'certificate' | 'tax_return_personal' | 'tax_return_corporate' | 'unknown';
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
}

export interface SearchResponse {
  search_id: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    score: number;
  }>;
}

export interface FetchResponse {
  content_id: string;
  url: string;
  content_type: string;
  content: string;
  extracted_at: string;
}

export interface IngestResponse {
  evidence_id: string;
  content_id: string;
  application_id: string;
  metadata: Record<string, any>;
}

export interface GenerateResponse {
  generation_id: string;
  content: string;
  citations: Array<{
    evidence_id: string;
    text: string;
    url: string;
  }>;
}

export interface Kpi {
  name: string;
  baseline: number;
  target: number;
  unit: string;
  measurement_method?: string;
  frequency?: string;
}

export interface KpiResponse {
  kpi_set_id: string;
  kpis: Kpi[];
}

export interface BudgetItem {
  category: string;
  name: string;
  amount: number;
  is_eligible: boolean;
  subsidy_rate: number;
}

export interface Budget {
  items: BudgetItem[];
  total_amount: number;
  subsidy_amount: number;
  self_funding: number;
}

export interface BudgetResponse {
  budget_id: string;
  budget: Budget;
}

export interface ScheduleTask {
  id: string;
  name: string;
  start: string;
  end: string;
  dependencies: string[];
}

export interface Schedule {
  tasks: ScheduleTask[];
  start_date: string;
  end_date: string;
  critical_path: string[];
}

export interface ScheduleResponse {
  schedule_id: string;
  schedule: Schedule;
  gantt_svg: string;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationSuggestion {
  type: string;
  message: string;
  proposed_fix: string;
}

export interface ValidationResponse {
  is_valid: boolean;
  errors: ValidationError[];
  suggestions: ValidationSuggestion[];
}

export interface PreflightError {
  rule_id: string;
  message: string;
}

export interface PreflightResponse {
  is_valid: boolean;
  page_count: number;
  page_size: string;
  fonts_embedded: boolean;
  errors: PreflightError[];
}

export interface JobResponse {
  job_id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress: number;
  result_url?: string;
}

export interface TemplateResponse {
  template_id: string;
  name: string;
  version: string;
  sha256: string;
  created_at: string;
}

export interface FieldMapping {
  field_key: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  max_chars?: number;
  format?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}