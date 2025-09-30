import { Injectable } from '@nestjs/common';
import { BaselineBuildResponseDto, BaselineValue } from '../dto/auto-plan.dto';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class BaselineBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 現状推定とDB保存
   * - Application/Evidence から抽出値を集約して推定
   * - 結果をApplication.baselinesに保存
   */
  async build(applicationId: string): Promise<BaselineBuildResponseDto['baselines']> {
    try {
      // 1. 既存のApplicationを確認
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          evidences: {
            where: { fileType: 'TAX_RETURN' },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // 2. 確定申告書データから推定（存在する場合）
      let baselines: Record<string, BaselineValue>;

      if (application?.evidences?.[0]?.content) {
        const extractedData = application.evidences[0].content as any;

        // 実データから計算
        const annualSales = extractedData.sales_amount || extractedData.revenue || 12_000_000;
        const monthlySales = Math.round(annualSales / 12);
        const grossMargin = extractedData.gross_margin_rate || 0.38;
        const adExpenses = extractedData.advertising_expenses || annualSales * 0.05;
        const adRatio = annualSales > 0 ? adExpenses / annualSales : 0.05;

        baselines = {
          sales_monthly: {
            value: monthlySales,
            source: `evidence:${application.evidences[0].id}:sales`,
            confidence: 0.95
          },
          gross_margin: {
            value: grossMargin,
            source: `evidence:${application.evidences[0].id}:margin`,
            confidence: 0.92
          },
          ad_ratio: {
            value: adRatio,
            source: `evidence:${application.evidences[0].id}:ad`,
            confidence: 0.88
          },
          customers_monthly: {
            value: extractedData.customer_count ? Math.round(extractedData.customer_count / 12) : null,
            source: extractedData.customer_count ? `evidence:${application.evidences[0].id}:customers` : null,
            confidence: extractedData.customer_count ? 0.85 : 0.0,
            note: extractedData.customer_count ? undefined : '推定不可'
          },
        };
      } else {
        // フォールバック：保守的な推定値
        baselines = {
          sales_monthly: { value: 1_000_000, source: 'estimated:conservative', confidence: 0.7 },
          gross_margin: { value: 0.35, source: 'estimated:industry_average', confidence: 0.75 },
          ad_ratio: { value: 0.05, source: 'estimated:industry_average', confidence: 0.7 },
          customers_monthly: { value: null, source: null, confidence: 0.0, note: '推定不可' },
        };
      }

      // 3. DB保存（applicationが存在する場合）
      if (application) {
        await this.prisma.application.update({
          where: { id: applicationId },
          data: {
            baselines: baselines as any,
            updatedAt: new Date()
          }
        });
      }

      return baselines;
    } catch (error) {
      // エラー時は安全なフォールバック
      console.warn('Baseline build error:', error);
      return {
        sales_monthly: { value: 1_000_000, source: 'fallback', confidence: 0.5 },
        gross_margin: { value: 0.35, source: 'fallback', confidence: 0.5 },
        ad_ratio: { value: 0.05, source: 'fallback', confidence: 0.5 },
        customers_monthly: { value: null, source: null, confidence: 0.0, note: 'エラーにより推定不可' },
      };
    }
  }
}

