import { Injectable } from '@nestjs/common';
import { KPIItemDto, ValidateKpisResponseDto } from '../dto/auto-plan.dto';

@Injectable()
export class KPIValidatorService {
  validate(input: { kpis: KPIItemDto[]; months: number }): ValidateKpisResponseDto {
    const warnings: ValidateKpisResponseDto['warnings'] = [];
    const fixes: ValidateKpisResponseDto['fixes'] = [];

    const months = input.months || 6;
    const growthCap = months <= 3 ? 0.3 : months <= 6 ? 0.7 : 1.2;

    for (const kpi of input.kpis || []) {
      // 件数系: target >= baseline, 成長率上限
      if (kpi.unit.includes('件')) {
        if (typeof kpi.baseline === 'number' && kpi.baseline > 0) {
          const growth = (kpi.target - kpi.baseline) / kpi.baseline;
          if (growth < 0) {
            warnings.push({ code: 'NEGATIVE_GROWTH', message: '件数系KPIの目標がベースラインを下回っています', kpi: kpi.name });
            fixes.push({ type: 'adjust_target', message: '目標をベースライン以上に設定', kpi: kpi.name, suggestion: { target: kpi.baseline } });
          }
          if (growth > growthCap) {
            warnings.push({ code: 'OVER_GROWTH_CAP', message: `成長率が上限(${Math.round(growthCap * 100)}%)を超過`, kpi: kpi.name });
            fixes.push({ type: 'cap_target', message: '上限内に調整', kpi: kpi.name, suggestion: { max_growth: growthCap } });
          }
        }
      }

      // 率系: 0-100範囲、絶対上昇幅上限（CVR +0.6pp/6ヶ月相当）
      if (kpi.unit === '%') {
        if (kpi.target < 0 || kpi.target > 100) {
          warnings.push({ code: 'PERCENT_RANGE', message: '割合の範囲(0-100)を逸脱', kpi: kpi.name });
          fixes.push({ type: 'clamp', message: '0-100に丸め', kpi: kpi.name });
        }
        if (typeof kpi.baseline === 'number') {
          const liftCap = 0.6 * Math.min(1, months / 6); // CVR上昇幅の簡易上限
          const lift = kpi.target - kpi.baseline;
          if (lift > liftCap) {
            warnings.push({ code: 'OVER_ABSOLUTE_LIFT', message: `絶対上昇幅が上限(${liftCap.toFixed(1)}pp)を超過`, kpi: kpi.name });
            fixes.push({ type: 'cap_lift', message: '上限内に調整', kpi: kpi.name, suggestion: { max_lift: liftCap } });
          }
        }
      }

      // methodチェック（簡易）
      const allowed = ['GA4', 'POS', 'CRM', '広告管理', '問い合わせ台帳'];
      if (!allowed.includes(kpi.method)) {
        warnings.push({ code: 'METHOD_DICT', message: `測定方法が辞書に未登録: ${kpi.method}`, kpi: kpi.name });
      }
    }

    return { ok: warnings.length === 0, warnings, fixes };
  }
}

