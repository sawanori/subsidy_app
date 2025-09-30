import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentStructurerService {
  structure(initiatives: { text: string; tags: string[] }[]) {
    const themes: string[] = [];
    const out = initiatives.map((i) => {
      const text = (i.text || '').toLowerCase();
      if (text.includes('cvr') || text.includes('改善')) themes.push('CVR改善');
      if (text.includes('新規') || i.tags?.includes('新規獲得')) themes.push('新規獲得');
      if (text.includes('ec') || i.tags?.includes('EC')) themes.push('EC改善');
      if (text.includes('ltv') || text.includes('リピート')) themes.push('LTV向上');
      if (text.includes('seo')) themes.push('ローカルSEO');
      return { ...i, themes: Array.from(new Set(themes)) };
    });
    return out;
  }
}

