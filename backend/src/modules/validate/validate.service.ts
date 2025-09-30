import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

/**
 * ValidateService - 草案検証サービス
 *
 * 4つの検証レベル:
 * 1. フィールドバリデーション（文字数、必須項目、形式）
 * 2. ビジネスルール検証（予算制約、補助率、禁止用語）
 * 3. 整合性検証（セクション間の整合性）
 * 4. プリフライトチェック（PDF生成前検証）
 */

export interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: 'error' | 'warning' | 'info';
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
  stats: {
    chars: number;
    words: number;
    sectionsCompleted: number;
    totalSections: number;
  };
}

@Injectable()
export class ValidateService {
  private readonly logger = new Logger(ValidateService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 包括的な草案検証
   */
  async validateDraft(params: {
    draftId: string;
    schemeId: string;
  }): Promise<ValidationResult> {
    const { draftId, schemeId } = params;

    // 1. Draft取得
    const draft = await this.prisma.draft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      throw new Error(`Draft not found: ${draftId}`);
    }

    // 2. SchemeTemplate取得
    const template = await this.prisma.schemeTemplate.findUnique({
      where: { schemeId },
    });

    if (!template) {
      throw new Error(`SchemeTemplate not found: ${schemeId}`);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    // 3. フィールドバリデーション
    const fieldErrors = this.validateFields(draft.sections, template.requirements);
    errors.push(...fieldErrors.errors);
    warnings.push(...fieldErrors.warnings);

    // 4. ビジネスルール検証
    const businessErrors = this.validateBusinessRules(draft.sections, template.requirements);
    errors.push(...businessErrors.errors);
    warnings.push(...businessErrors.warnings);

    // 5. 整合性検証
    const consistencyErrors = this.validateConsistency(draft.sections);
    errors.push(...consistencyErrors.errors);
    warnings.push(...consistencyErrors.warnings);

    // 6. 統計情報計算
    const stats = this.calculateStats(draft.sections, template.requirements);

    // 7. 提案生成
    if (stats.sectionsCompleted < stats.totalSections) {
      suggestions.push(`${stats.totalSections - stats.sectionsCompleted}個のセクションが未完成です`);
    }
    if (errors.length === 0 && warnings.length > 0) {
      suggestions.push('警告を確認して、品質を向上させることを推奨します');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      stats,
    };
  }

  /**
   * フィールドバリデーション
   */
  private validateFields(
    sections: any,
    requirements: any,
  ): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    const sectionReqs = requirements.sections || [];

    for (const req of sectionReqs) {
      const section = sections[req.id];

      // 必須チェック
      if (req.required && !section) {
        errors.push({
          code: 'REQUIRED_FIELD_MISSING',
          message: `必須セクション「${req.name}」が未入力です`,
          field: req.id,
          severity: 'error',
        });
        continue;
      }

      if (!section) continue;

      // 文字数チェック（テキストセクション）
      if (req.minChars && typeof section === 'string') {
        if (section.length < req.minChars) {
          errors.push({
            code: 'TEXT_TOO_SHORT',
            message: `「${req.name}」が短すぎます（${section.length}文字 < ${req.minChars}文字）`,
            field: req.id,
            severity: 'error',
            value: section.length,
          });
        }
        if (req.maxChars && section.length > req.maxChars) {
          errors.push({
            code: 'TEXT_TOO_LONG',
            message: `「${req.name}」が長すぎます（${section.length}文字 > ${req.maxChars}文字）`,
            field: req.id,
            severity: 'error',
            value: section.length,
          });
        }
      }

      // 項目数チェック（配列セクション）
      if (req.minItems && Array.isArray(section)) {
        if (section.length < req.minItems) {
          errors.push({
            code: 'ITEMS_TOO_FEW',
            message: `「${req.name}」の項目数が不足しています（${section.length}件 < ${req.minItems}件）`,
            field: req.id,
            severity: 'error',
            value: section.length,
          });
        }
      }

      // 必須フィールドチェック（オブジェクトセクション）
      if (req.fields && typeof section === 'object' && !Array.isArray(section)) {
        for (const field of req.fields) {
          if (!section[field]) {
            warnings.push({
              code: 'FIELD_MISSING',
              message: `「${req.name}」の「${field}」が未入力です`,
              field: `${req.id}.${field}`,
              severity: 'warning',
            });
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * ビジネスルール検証
   */
  private validateBusinessRules(
    sections: any,
    requirements: any,
  ): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 予算検証
    if (sections.budget && Array.isArray(sections.budget)) {
      const totalBudget = sections.budget.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      if (requirements.budget?.maxTotal && totalBudget > requirements.budget.maxTotal) {
        errors.push({
          code: 'BUDGET_EXCEEDS_MAX',
          message: `予算総額が上限を超過しています（${totalBudget.toLocaleString()}円 > ${requirements.budget.maxTotal.toLocaleString()}円）`,
          field: 'budget',
          severity: 'error',
          value: totalBudget,
        });
      }

      // 対象経費カテゴリチェック
      const eligibleCategories = requirements.budget?.eligibleCategories || [];
      const excludedCategories = requirements.budget?.excludedCategories || [];

      for (const item of sections.budget) {
        if (excludedCategories.includes(item.category)) {
          errors.push({
            code: 'INELIGIBLE_CATEGORY',
            message: `「${item.category}」は対象外経費です`,
            field: 'budget',
            severity: 'error',
            value: item.category,
          });
        }

        if (eligibleCategories.length > 0 && !eligibleCategories.includes(item.category)) {
          warnings.push({
            code: 'CATEGORY_NOT_IN_LIST',
            message: `「${item.category}」が対象経費リストにありません`,
            field: 'budget',
            severity: 'warning',
            value: item.category,
          });
        }
      }
    }

    // 禁止用語チェック
    const prohibitedTerms = requirements.prohibitedTerms || [];
    const textSections = ['background', 'problemSolution', 'differentiation'];

    for (const sectionId of textSections) {
      const text = sections[sectionId];
      if (typeof text === 'string') {
        for (const term of prohibitedTerms) {
          if (text.includes(term)) {
            errors.push({
              code: 'PROHIBITED_TERM',
              message: `禁止用語「${term}」が使用されています`,
              field: sectionId,
              severity: 'error',
              value: term,
            });
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * 整合性検証
   */
  private validateConsistency(sections: any): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 予算とKPIの整合性
    if (sections.budget && sections.kpi) {
      const totalBudget = Array.isArray(sections.budget)
        ? sections.budget.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
        : 0;

      // KPIに売上目標がある場合、予算との比率をチェック
      const salesKPI = Array.isArray(sections.kpi)
        ? sections.kpi.find((k: any) => k.metric?.includes('売上') || k.metric?.includes('revenue'))
        : null;

      if (salesKPI && totalBudget > 0) {
        const targetValue = Number(salesKPI.target) || 0;
        const baselineValue = Number(salesKPI.baseline) || 0;
        const expectedIncrease = targetValue - baselineValue;

        if (expectedIncrease > 0 && totalBudget > expectedIncrease) {
          warnings.push({
            code: 'BUDGET_ROI_LOW',
            message: `予算が売上増加額より大きいです（ROI < 100%）`,
            field: 'budget',
            severity: 'warning',
          });
        }
      }
    }

    // スケジュールとチームの整合性
    if (sections.roadmap && sections.team) {
      const teamSize = Array.isArray(sections.team) ? sections.team.length : 0;
      const phaseCount = Array.isArray(sections.roadmap) ? sections.roadmap.length : 0;

      if (teamSize < 2 && phaseCount > 3) {
        warnings.push({
          code: 'TEAM_SIZE_SMALL',
          message: `フェーズ数に対してチーム人数が少ない可能性があります`,
          field: 'team',
          severity: 'warning',
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * 統計情報計算
   */
  private calculateStats(sections: any, requirements: any): {
    chars: number;
    words: number;
    sectionsCompleted: number;
    totalSections: number;
  } {
    let chars = 0;
    let words = 0;
    let sectionsCompleted = 0;

    const sectionReqs = requirements.sections || [];
    const totalSections = sectionReqs.filter((s: any) => s.required).length;

    for (const req of sectionReqs) {
      const section = sections[req.id];

      if (section) {
        sectionsCompleted++;

        if (typeof section === 'string') {
          chars += section.length;
          words += (section.match(/\S+/g) || []).length;
        }
      }
    }

    return {
      chars,
      words,
      sectionsCompleted,
      totalSections,
    };
  }

  /**
   * 既存のvalidatePlan()メソッド（後方互換性のため保持）
   */
  async validatePlan(payload: any) {
    const text: string = payload?.text ?? '';
    const chars = text.length;
    const words = (text.match(/\S+/g) || []).length;

    const errors: any[] = [];
    const warnings: any[] = [];

    if (chars > 20000) {
      errors.push({ code: 'LEN_OVER', message: '本文が上限を超過', field: 'text', severity: 'error' });
    }
    if (!payload?.numbers?.budget_total) {
      warnings.push({
        code: 'BUDGET_MISSING',
        message: '予算総額が未入力',
        field: 'numbers.budget_total',
        severity: 'warning',
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      suggestions: [],
      stats: { chars, words },
      warnings,
    };
  }
}

