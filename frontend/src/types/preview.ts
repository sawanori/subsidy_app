export interface SubsidyFormData {
  // 基本情報
  companyName: string;
  representativeName: string;
  address: string;
  phone: string;
  email: string;
  
  // 申請情報
  subsidyType: 'form1' | 'form2' | 'form4';
  projectTitle: string;
  projectDescription: string;
  requestAmount: number;
  projectPeriod: {
    startDate: string;
    endDate: string;
  };
  
  // 詳細項目（様式別）
  businessPlan?: string;
  technologyDescription?: string;
  marketAnalysis?: string;
  budgetBreakdown?: BudgetItem[];
  timeline?: TimelineItem[];
  
  // メタデータ
  lastUpdated: string;
  version: number;
}

export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface TimelineItem {
  id: string;
  phase: string;
  description: string;
  startDate: string;
  endDate: string;
  deliverables: string[];
}

export interface PreviewConfig {
  formType: 'form1' | 'form2' | 'form4' | 'confirmation';
  displayMode: 'pdf' | 'html' | 'both';
  showGrid: boolean;
  showWatermark: boolean;
  scale: number;
}

export interface PreviewState {
  isLoading: boolean;
  error: string | null;
  lastGenerated: string | null;
  cacheKey: string | null;
}

// PDF生成設定
export interface PDFGenerationOptions {
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: string;
  footer?: string;
  includePageNumbers: boolean;
}

// リアルタイム更新のイベント型
export interface PreviewUpdateEvent {
  type: 'field_change' | 'form_switch' | 'config_change';
  payload: {
    fieldPath?: string;
    newValue?: unknown;
    formType?: string;
    config?: Partial<PreviewConfig>;
  };
  timestamp: number;
}