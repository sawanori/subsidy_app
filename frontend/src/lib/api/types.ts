// OpenAPI型定義（自動生成される型定義ファイル）
// openapi.yamlから生成される型を管理

export interface HealthCheckResponse {
  status: 'healthy';
  timestamp: string;
  version: string;
}

export interface IntakeUploadRequest {
  file: File;
  type: 'certificate' | 'tax_return' | 'other';
}

export interface IntakeResponse {
  file_id: string;
  sha256: string;
  mime_type: string;
  size: number;
  status: 'uploaded' | 'scanning' | 'ready' | 'rejected';
}

export interface ExtractRequest {
  file_id: string;
  ocr_provider?: 'tesseract' | 'cloud';
}

export interface ExtractResponse {
  extraction_id: string;
  file_id: string;
  document_type: 'certificate' | 'tax_return_personal' | 'tax_return_corporate' | 'unknown';
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
}

export interface SearchRequest {
  query: string;
  provider?: 'bing' | 'google';
  max_results?: number;
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

export interface FetchRequest {
  url: string;
}

export interface FetchResponse {
  content_id: string;
  url: string;
  content_type: string;
  content: string;
  extracted_at: string;
}

export interface IngestRequest {
  content_id: string;
  application_id: string;
}

export interface IngestResponse {
  evidence_id: string;
  content_id: string;
  application_id: string;
  metadata: Record<string, any>;
}

export interface GenerateBackgroundRequest {
  application_id: string;
  evidence_ids?: string[];
}

export interface GenerateSolutionRequest {
  application_id: string;
  background_id: string;
}

export interface GenerateKpisRequest {
  application_id: string;
  solution_id: string;
}

export interface GenerateBudgetRequest {
  application_id: string;
  solution_id: string;
}

export interface GenerateScheduleRequest {
  application_id: string;
  solution_id: string;
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

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  path: string;
}

// エラーコード定義
export enum ErrorCode {
  // Intake関連エラー
  ERR_INGEST_MIME = 'ERR_INGEST_MIME',
  ERR_INGEST_SIZE = 'ERR_INGEST_SIZE',
  ERR_INGEST_MALWARE = 'ERR_INGEST_MALWARE',
  ERR_INGEST_EXTENSION = 'ERR_INGEST_EXTENSION',
  ERR_INGEST_CORRUPT = 'ERR_INGEST_CORRUPT',

  // OCR関連エラー
  ERR_OCR_LOW_CONF = 'ERR_OCR_LOW_CONF',
  ERR_OCR_FAILED = 'ERR_OCR_FAILED',
  ERR_OCR_TIMEOUT = 'ERR_OCR_TIMEOUT',
  ERR_OCR_LANGUAGE = 'ERR_OCR_LANGUAGE',

  // 検証関連エラー
  ERR_VALIDATION_TEXT = 'ERR_VALIDATION_TEXT',
  ERR_VALIDATION_KPI = 'ERR_VALIDATION_KPI',
  ERR_VALIDATION_BUDGET = 'ERR_VALIDATION_BUDGET',
  ERR_VALIDATION_SCHEDULE = 'ERR_VALIDATION_SCHEDULE',

  // Preflight関連エラー
  ERR_PREFLIGHT_PAGE_LIMIT = 'ERR_PREFLIGHT_PAGE_LIMIT',
  ERR_PREFLIGHT_FONT_MISSING = 'ERR_PREFLIGHT_FONT_MISSING',
  ERR_PREFLIGHT_FONT_MISMATCH = 'ERR_PREFLIGHT_FONT_MISMATCH',
  ERR_PREFLIGHT_MARGIN = 'ERR_PREFLIGHT_MARGIN',

  // Budget関連エラー
  ERR_BUDGET_RULE_MISS = 'ERR_BUDGET_RULE_MISS',
  ERR_BUDGET_CALC_ERROR = 'ERR_BUDGET_CALC_ERROR',
  ERR_BUDGET_OVER_LIMIT = 'ERR_BUDGET_OVER_LIMIT',

  // Export関連エラー
  ERR_EXPORT_TIMEOUT = 'ERR_EXPORT_TIMEOUT',
  ERR_EXPORT_FAILED = 'ERR_EXPORT_FAILED',
  ERR_EXPORT_TEMPLATE = 'ERR_EXPORT_TEMPLATE',

  // コスト関連エラー
  ERR_COST_LIMIT = 'ERR_COST_LIMIT',
  ERR_COST_ESTIMATE = 'ERR_COST_ESTIMATE',

  // 認証・認可関連エラー
  ERR_AUTH_INVALID = 'ERR_AUTH_INVALID',
  ERR_AUTH_EXPIRED = 'ERR_AUTH_EXPIRED',
  ERR_AUTH_FORBIDDEN = 'ERR_AUTH_FORBIDDEN',

  // システムエラー
  ERR_SYSTEM_DATABASE = 'ERR_SYSTEM_DATABASE',
  ERR_SYSTEM_STORAGE = 'ERR_SYSTEM_STORAGE',
  ERR_SYSTEM_NETWORK = 'ERR_SYSTEM_NETWORK',
  ERR_SYSTEM_INTERNAL = 'ERR_SYSTEM_INTERNAL',
}