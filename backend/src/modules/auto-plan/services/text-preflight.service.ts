import { Injectable } from '@nestjs/common';
import { ValidateTextRequestDto, ValidateTextResponseDto } from '../dto/auto-plan.dto';

@Injectable()
export class TextPreflightService {
  validate(dto: ValidateTextRequestDto): ValidateTextResponseDto {
    const text = dto.text || '';
    const errors: ValidateTextResponseDto['errors'] = [];
    const fixes: ValidateTextResponseDto['fixes'] = [];

    const maxLen = 2000; // 簡易上限
    if (text.length === 0) {
      errors.push({ code: 'EMPTY', message: 'テキストが空です' });
      fixes.push({ type: 'summarize', new_text: '（自動生成予定の本文）' });
    }
    if (text.length > maxLen) {
      errors.push({ code: 'LEN_MAX', message: `文字数上限(${maxLen})を超えています` });
      fixes.push({ type: 'shorten', new_text: text.slice(0, maxLen) + '…' });
    }

    const banned = ['NGワード'];
    for (const w of banned) {
      if (text.includes(w)) {
        errors.push({ code: 'BANNED', message: `禁止語を含みます: ${w}` });
      }
    }

    // 引用がゼロの場合は警告（ここではエラー扱いにしない）
    if (!text.includes('[citation:')) {
      // no-op: 実生成時に citations フィールドで担保
    }

    return { ok: errors.length === 0, errors, fixes };
  }
}

