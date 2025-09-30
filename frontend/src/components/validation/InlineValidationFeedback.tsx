'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { ValidationError } from './ValidationResultDisplay';

/**
 * InlineValidationFeedback - インライン検証フィードバック
 *
 * Phase 4: フォームフィールド横のリアルタイム検証表示
 */

interface InlineValidationFeedbackProps {
  fieldName: string;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  showSuccess?: boolean;
}

export const InlineValidationFeedback: React.FC<InlineValidationFeedbackProps> = ({
  fieldName,
  errors = [],
  warnings = [],
  showSuccess = true
}) => {
  const fieldErrors = errors.filter(e => e.field === fieldName);
  const fieldWarnings = warnings.filter(w => w.field === fieldName);

  const hasErrors = fieldErrors.length > 0;
  const hasWarnings = fieldWarnings.length > 0;
  const isValid = !hasErrors && !hasWarnings;

  if (!hasErrors && !hasWarnings && !showSuccess) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* エラー表示 */}
      {fieldErrors.map((error, index) => (
        <div
          key={`error-${index}`}
          className="flex items-start gap-2 text-sm text-destructive p-2 bg-destructive/10 rounded-md border border-destructive/20"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium">{error.message}</div>
            {error.value !== undefined && (
              <div className="text-xs opacity-80 mt-1">
                現在値: {JSON.stringify(error.value)}
              </div>
            )}
          </div>
          <Badge variant="destructive" className="text-xs">
            {error.code}
          </Badge>
        </div>
      ))}

      {/* 警告表示 */}
      {fieldWarnings.map((warning, index) => (
        <div
          key={`warning-${index}`}
          className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-800"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium">{warning.message}</div>
          </div>
          <Badge
            variant="outline"
            className="text-xs border-yellow-600 text-yellow-700 dark:text-yellow-400"
          >
            {warning.code}
          </Badge>
        </div>
      ))}

      {/* 成功表示 */}
      {isValid && showSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span>検証OK</span>
        </div>
      )}
    </div>
  );
};

/**
 * FieldValidationBadge - フィールド横の検証バッジ
 *
 * フィールドラベル横に表示する簡易バッジ
 */

interface FieldValidationBadgeProps {
  fieldName: string;
  errors?: ValidationError[];
  warnings?: ValidationError[];
}

export const FieldValidationBadge: React.FC<FieldValidationBadgeProps> = ({
  fieldName,
  errors = [],
  warnings = []
}) => {
  const fieldErrors = errors.filter(e => e.field === fieldName);
  const fieldWarnings = warnings.filter(w => w.field === fieldName);

  const hasErrors = fieldErrors.length > 0;
  const hasWarnings = fieldWarnings.length > 0;

  if (!hasErrors && !hasWarnings) {
    return null;
  }

  if (hasErrors) {
    return (
      <Badge variant="destructive" className="ml-2">
        <AlertCircle className="h-3 w-3 mr-1" />
        {fieldErrors.length}
      </Badge>
    );
  }

  if (hasWarnings) {
    return (
      <Badge
        variant="outline"
        className="ml-2 border-yellow-600 text-yellow-700 dark:text-yellow-400"
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {fieldWarnings.length}
      </Badge>
    );
  }

  return null;
};