// Phase 2: Extended Application Types

// Purpose & Background Types
export interface CurrentIssue {
  category: string;
  description: string;
  impact: string;
}

export interface LogicTreeNode {
  id: string;
  type: 'issue' | 'cause' | 'solution';
  content: string;
  children?: LogicTreeNode[];
}

export interface PurposeBackground {
  currentIssues: CurrentIssue[];
  painPoints: string;
  rootCause?: string;
  solution: string;
  approach: string;
  uniqueValue?: string;
  logicTree?: LogicTreeNode;
}

// Detailed Plan Types
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DetailedPlan {
  id?: string;
  what: string;
  why: string;
  who: string;
  where: string;
  when: string;
  how: string;
  priority: Priority;
  category: string;
  expectedResult: string;
  prerequisite?: string;
  relatedTaskIds?: string[];
  orderIndex: number;
}

// KPI Target Types
export type KpiCategory = 
  | 'SALES'
  | 'CUSTOMERS'
  | 'UNIT_PRICE'
  | 'CONVERSION'
  | 'RETENTION'
  | 'EFFICIENCY'
  | 'QUALITY'
  | 'CUSTOM';

export type ChartType = 'LINE' | 'BAR' | 'AREA' | 'PIE' | 'GAUGE';

export interface KpiTarget {
  id?: string;
  category: KpiCategory;
  metric: string;
  unit: string;
  currentValue: number;
  year1Target: number;
  year2Target?: number;
  year3Target?: number;
  formula?: string;
  assumptions?: Record<string, any>;
  chartType: ChartType;
  displayOrder: number;
}

// Gantt Chart Types
export type TaskType = 'PHASE' | 'TASK' | 'SUBTASK' | 'MILESTONE';
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF'; // Finish-Start, Start-Start, etc.

export interface TaskDependency {
  taskId: string;
  type: DependencyType;
}

export interface GanttTask {
  id?: string;
  taskName: string;
  description?: string;
  taskType: TaskType;
  startDate: Date | string;
  endDate: Date | string;
  duration: number;
  progress: number;
  dependencies?: TaskDependency[];
  parentTaskId?: string;
  assignee: string;
  assigneeRole?: string;
  resources?: Record<string, any>;
  color?: string;
  milestone: boolean;
  critical: boolean;
  orderIndex: number;
}

// Organization Structure Types
export type OrgChartType = 'HIERARCHY' | 'MATRIX' | 'FLAT' | 'NETWORK';

export interface RaciEntry {
  task: string;
  responsible: string[];
  accountable: string;
  consulted: string[];
  informed: string[];
}

export interface ExternalPartner {
  name: string;
  role: string;
  expertise: string;
}

export interface OrganizationStructure {
  chartData: any; // D3.js/mermaid hierarchy data
  chartType: OrgChartType;
  raciMatrix?: RaciEntry[];
  externalPartners?: ExternalPartner[];
  advisors?: Array<{
    name: string;
    title: string;
    expertise: string;
  }>;
}

export interface OrganizationRole {
  id?: string;
  name: string;
  title: string;
  department?: string;
  level: number;
  reportsTo?: string;
  responsibilities: string[];
  authorities?: string[];
  kpis?: string[];
  allocation: number; // percentage
  startDate?: Date | string;
  endDate?: Date | string;
}

// Risk Assessment Types
export type RiskCategory = 
  | 'TECHNICAL'
  | 'MARKET'
  | 'FINANCIAL'
  | 'OPERATIONAL'
  | 'LEGAL'
  | 'REPUTATIONAL'
  | 'STRATEGIC';

export type RiskAssessmentStatus = 
  | 'OPEN'
  | 'MITIGATING'
  | 'MONITORING'
  | 'CLOSED'
  | 'ESCALATED';

export interface RiskAssessment {
  id?: string;
  category: RiskCategory;
  title: string;
  description: string;
  probability: number; // 1-5
  impact: number; // 1-5
  riskScore: number; // probability * impact
  preventiveMeasures: string[];
  contingencyPlan?: string;
  triggerPoints?: string[];
  owner: string;
  reviewer?: string;
  status: RiskAssessmentStatus;
  reviewDate?: Date | string;
  affectedAreas?: string[];
  dependencies?: string[];
}

// Supplementary Material Types
export type MaterialType = 
  | 'MARKET_ANALYSIS'
  | 'COMPETITIVE_ANALYSIS'
  | 'BEFORE_AFTER'
  | 'CASE_STUDY'
  | 'EXTERNAL_VALIDATION'
  | 'FINANCIAL_PROJECTION'
  | 'TECHNICAL_SPEC'
  | 'CUSTOM';

export interface CompetitiveData {
  company: string;
  strengths: string[];
  weaknesses: string[];
  share: number;
}

export interface BeforeAfterState {
  metrics: Record<string, number>;
  description: string;
  visualData?: any;
}

export interface SupplementaryMaterial {
  id?: string;
  materialType: MaterialType;
  title: string;
  description?: string;
  content: any; // Structured data
  visualData?: any; // Chart/graph data
  marketSize?: number;
  growthRate?: number;
  targetSegment?: string;
  competitiveData?: CompetitiveData[];
  positioning?: string;
  beforeState?: BeforeAfterState;
  afterState?: BeforeAfterState;
  improvements?: Record<string, number>;
  source?: string;
  validUntil?: Date | string;
  confidence?: number; // 0-1
  orderIndex: number;
}

// Extended Application Data
export interface ExtendedApplicationData {
  purposeBackground: PurposeBackground;
  detailedPlans: DetailedPlan[];
  kpiTargets: KpiTarget[];
  ganttTasks: GanttTask[];
  organizationStructure: OrganizationStructure;
  organizationRoles: OrganizationRole[];
  riskAssessments: RiskAssessment[];
  supplementaryMaterials: SupplementaryMaterial[];
}

// Form validation schemas can be added here using zod
export const KPI_CATEGORIES = [
  { value: 'SALES', label: '売上' },
  { value: 'CUSTOMERS', label: '客数' },
  { value: 'UNIT_PRICE', label: '単価' },
  { value: 'CONVERSION', label: 'CV率' },
  { value: 'RETENTION', label: 'リテンション' },
  { value: 'EFFICIENCY', label: '効率性' },
  { value: 'QUALITY', label: '品質' },
  { value: 'CUSTOM', label: 'カスタム' },
] as const;

export const RISK_CATEGORIES = [
  { value: 'TECHNICAL', label: '技術リスク' },
  { value: 'MARKET', label: '市場リスク' },
  { value: 'FINANCIAL', label: '財務リスク' },
  { value: 'OPERATIONAL', label: '運用リスク' },
  { value: 'LEGAL', label: '法的リスク' },
  { value: 'REPUTATIONAL', label: '評判リスク' },
  { value: 'STRATEGIC', label: '戦略リスク' },
] as const;

export const MATERIAL_TYPES = [
  { value: 'MARKET_ANALYSIS', label: '市場分析' },
  { value: 'COMPETITIVE_ANALYSIS', label: '競合分析' },
  { value: 'BEFORE_AFTER', label: 'Before/After' },
  { value: 'CASE_STUDY', label: '事例' },
  { value: 'EXTERNAL_VALIDATION', label: '外部検証' },
  { value: 'FINANCIAL_PROJECTION', label: '財務予測' },
  { value: 'TECHNICAL_SPEC', label: '技術仕様' },
  { value: 'CUSTOM', label: 'カスタム' },
] as const;