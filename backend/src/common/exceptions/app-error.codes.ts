// 統一エラーコード体系
export enum ErrorCode {
  // Intake関連エラー (1000番台)
  ERR_INGEST_MIME = 'ERR_INGEST_MIME',
  ERR_INGEST_SIZE = 'ERR_INGEST_SIZE',
  ERR_INGEST_MALWARE = 'ERR_INGEST_MALWARE',
  ERR_INGEST_EXTENSION = 'ERR_INGEST_EXTENSION',
  ERR_INGEST_CORRUPT = 'ERR_INGEST_CORRUPT',

  // OCR関連エラー (2000番台)
  ERR_OCR_LOW_CONF = 'ERR_OCR_LOW_CONF',
  ERR_OCR_FAILED = 'ERR_OCR_FAILED',
  ERR_OCR_TIMEOUT = 'ERR_OCR_TIMEOUT',
  ERR_OCR_LANGUAGE = 'ERR_OCR_LANGUAGE',

  // 検証関連エラー (3000番台)
  ERR_VALIDATION_TEXT = 'ERR_VALIDATION_TEXT',
  ERR_VALIDATION_KPI = 'ERR_VALIDATION_KPI',
  ERR_VALIDATION_BUDGET = 'ERR_VALIDATION_BUDGET',
  ERR_VALIDATION_SCHEDULE = 'ERR_VALIDATION_SCHEDULE',

  // Preflight関連エラー (4000番台)
  ERR_PREFLIGHT_PAGE_LIMIT = 'ERR_PREFLIGHT_PAGE_LIMIT',
  ERR_PREFLIGHT_FONT_MISSING = 'ERR_PREFLIGHT_FONT_MISSING',
  ERR_PREFLIGHT_FONT_MISMATCH = 'ERR_PREFLIGHT_FONT_MISMATCH',
  ERR_PREFLIGHT_MARGIN = 'ERR_PREFLIGHT_MARGIN',

  // Budget関連エラー (5000番台)
  ERR_BUDGET_RULE_MISS = 'ERR_BUDGET_RULE_MISS',
  ERR_BUDGET_CALC_ERROR = 'ERR_BUDGET_CALC_ERROR',
  ERR_BUDGET_OVER_LIMIT = 'ERR_BUDGET_OVER_LIMIT',

  // Export関連エラー (6000番台)
  ERR_EXPORT_TIMEOUT = 'ERR_EXPORT_TIMEOUT',
  ERR_EXPORT_FAILED = 'ERR_EXPORT_FAILED',
  ERR_EXPORT_TEMPLATE = 'ERR_EXPORT_TEMPLATE',

  // コスト関連エラー (7000番台)
  ERR_COST_LIMIT = 'ERR_COST_LIMIT',
  ERR_COST_ESTIMATE = 'ERR_COST_ESTIMATE',

  // 認証・認可関連エラー (8000番台)
  ERR_AUTH_INVALID = 'ERR_AUTH_INVALID',
  ERR_AUTH_EXPIRED = 'ERR_AUTH_EXPIRED',
  ERR_AUTH_FORBIDDEN = 'ERR_AUTH_FORBIDDEN',

  // システムエラー (9000番台)
  ERR_SYSTEM_DATABASE = 'ERR_SYSTEM_DATABASE',
  ERR_SYSTEM_STORAGE = 'ERR_SYSTEM_STORAGE',
  ERR_SYSTEM_NETWORK = 'ERR_SYSTEM_NETWORK',
  ERR_SYSTEM_INTERNAL = 'ERR_SYSTEM_INTERNAL',

  // Research関連エラー (10000番台)
  ERR_RESEARCH_TIMEOUT = 'ERR_RESEARCH_TIMEOUT',
  ERR_RESEARCH_QUOTA = 'ERR_RESEARCH_QUOTA',
}

export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

export const ErrorMessages: Record<ErrorCode, ErrorDetail> = {
  // Intake関連
  [ErrorCode.ERR_INGEST_MIME]: {
    code: ErrorCode.ERR_INGEST_MIME,
    message: 'Invalid MIME type',
    statusCode: 400,
  },
  [ErrorCode.ERR_INGEST_SIZE]: {
    code: ErrorCode.ERR_INGEST_SIZE,
    message: 'File size exceeds limit',
    statusCode: 413,
  },
  [ErrorCode.ERR_INGEST_MALWARE]: {
    code: ErrorCode.ERR_INGEST_MALWARE,
    message: 'Malware detected in file',
    statusCode: 400,
  },
  [ErrorCode.ERR_INGEST_EXTENSION]: {
    code: ErrorCode.ERR_INGEST_EXTENSION,
    message: 'File extension not allowed',
    statusCode: 400,
  },
  [ErrorCode.ERR_INGEST_CORRUPT]: {
    code: ErrorCode.ERR_INGEST_CORRUPT,
    message: 'File is corrupted or unreadable',
    statusCode: 400,
  },

  // OCR関連
  [ErrorCode.ERR_OCR_LOW_CONF]: {
    code: ErrorCode.ERR_OCR_LOW_CONF,
    message: 'OCR confidence below threshold',
    statusCode: 422,
  },
  [ErrorCode.ERR_OCR_FAILED]: {
    code: ErrorCode.ERR_OCR_FAILED,
    message: 'OCR processing failed',
    statusCode: 500,
  },
  [ErrorCode.ERR_OCR_TIMEOUT]: {
    code: ErrorCode.ERR_OCR_TIMEOUT,
    message: 'OCR processing timeout',
    statusCode: 504,
  },
  [ErrorCode.ERR_OCR_LANGUAGE]: {
    code: ErrorCode.ERR_OCR_LANGUAGE,
    message: 'Language not supported for OCR',
    statusCode: 400,
  },

  // 検証関連
  [ErrorCode.ERR_VALIDATION_TEXT]: {
    code: ErrorCode.ERR_VALIDATION_TEXT,
    message: 'Text validation failed',
    statusCode: 422,
  },
  [ErrorCode.ERR_VALIDATION_KPI]: {
    code: ErrorCode.ERR_VALIDATION_KPI,
    message: 'KPI validation failed',
    statusCode: 422,
  },
  [ErrorCode.ERR_VALIDATION_BUDGET]: {
    code: ErrorCode.ERR_VALIDATION_BUDGET,
    message: 'Budget validation failed',
    statusCode: 422,
  },
  [ErrorCode.ERR_VALIDATION_SCHEDULE]: {
    code: ErrorCode.ERR_VALIDATION_SCHEDULE,
    message: 'Schedule validation failed',
    statusCode: 422,
  },

  // Preflight関連
  [ErrorCode.ERR_PREFLIGHT_PAGE_LIMIT]: {
    code: ErrorCode.ERR_PREFLIGHT_PAGE_LIMIT,
    message: 'Page count exceeds limit',
    statusCode: 422,
  },
  [ErrorCode.ERR_PREFLIGHT_FONT_MISSING]: {
    code: ErrorCode.ERR_PREFLIGHT_FONT_MISSING,
    message: 'Required fonts not embedded',
    statusCode: 422,
  },
  [ErrorCode.ERR_PREFLIGHT_FONT_MISMATCH]: {
    code: ErrorCode.ERR_PREFLIGHT_FONT_MISMATCH,
    message: 'Font version mismatch',
    statusCode: 422,
  },
  [ErrorCode.ERR_PREFLIGHT_MARGIN]: {
    code: ErrorCode.ERR_PREFLIGHT_MARGIN,
    message: 'Margin requirements not met',
    statusCode: 422,
  },

  // Budget関連
  [ErrorCode.ERR_BUDGET_RULE_MISS]: {
    code: ErrorCode.ERR_BUDGET_RULE_MISS,
    message: 'Budget rule not found',
    statusCode: 422,
  },
  [ErrorCode.ERR_BUDGET_CALC_ERROR]: {
    code: ErrorCode.ERR_BUDGET_CALC_ERROR,
    message: 'Budget calculation error',
    statusCode: 422,
  },
  [ErrorCode.ERR_BUDGET_OVER_LIMIT]: {
    code: ErrorCode.ERR_BUDGET_OVER_LIMIT,
    message: 'Budget exceeds maximum limit',
    statusCode: 422,
  },

  // Export関連
  [ErrorCode.ERR_EXPORT_TIMEOUT]: {
    code: ErrorCode.ERR_EXPORT_TIMEOUT,
    message: 'Export processing timeout',
    statusCode: 504,
  },
  [ErrorCode.ERR_EXPORT_FAILED]: {
    code: ErrorCode.ERR_EXPORT_FAILED,
    message: 'Export generation failed',
    statusCode: 500,
  },
  [ErrorCode.ERR_EXPORT_TEMPLATE]: {
    code: ErrorCode.ERR_EXPORT_TEMPLATE,
    message: 'Export template not found',
    statusCode: 404,
  },

  // コスト関連
  [ErrorCode.ERR_COST_LIMIT]: {
    code: ErrorCode.ERR_COST_LIMIT,
    message: 'API cost limit exceeded',
    statusCode: 429,
  },
  [ErrorCode.ERR_COST_ESTIMATE]: {
    code: ErrorCode.ERR_COST_ESTIMATE,
    message: 'Cost estimation failed',
    statusCode: 500,
  },

  // 認証・認可関連
  [ErrorCode.ERR_AUTH_INVALID]: {
    code: ErrorCode.ERR_AUTH_INVALID,
    message: 'Invalid authentication credentials',
    statusCode: 401,
  },
  [ErrorCode.ERR_AUTH_EXPIRED]: {
    code: ErrorCode.ERR_AUTH_EXPIRED,
    message: 'Authentication token expired',
    statusCode: 401,
  },
  [ErrorCode.ERR_AUTH_FORBIDDEN]: {
    code: ErrorCode.ERR_AUTH_FORBIDDEN,
    message: 'Access forbidden',
    statusCode: 403,
  },

  // システムエラー
  [ErrorCode.ERR_SYSTEM_DATABASE]: {
    code: ErrorCode.ERR_SYSTEM_DATABASE,
    message: 'Database error',
    statusCode: 500,
  },
  [ErrorCode.ERR_SYSTEM_STORAGE]: {
    code: ErrorCode.ERR_SYSTEM_STORAGE,
    message: 'Storage error',
    statusCode: 500,
  },
  [ErrorCode.ERR_SYSTEM_NETWORK]: {
    code: ErrorCode.ERR_SYSTEM_NETWORK,
    message: 'Network error',
    statusCode: 500,
  },
  [ErrorCode.ERR_SYSTEM_INTERNAL]: {
    code: ErrorCode.ERR_SYSTEM_INTERNAL,
    message: 'Internal server error',
    statusCode: 500,
  },

  // Research関連
  [ErrorCode.ERR_RESEARCH_TIMEOUT]: {
    code: ErrorCode.ERR_RESEARCH_TIMEOUT,
    message: 'Research request timeout',
    statusCode: 504,
  },
  [ErrorCode.ERR_RESEARCH_QUOTA]: {
    code: ErrorCode.ERR_RESEARCH_QUOTA,
    message: 'Research quota exceeded',
    statusCode: 429,
  },
};