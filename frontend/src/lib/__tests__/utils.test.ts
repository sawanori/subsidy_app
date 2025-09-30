import { cn } from '../utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', true && 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('hidden');
  });

  it('handles undefined and null', () => {
    const result = cn('base', undefined, null);
    expect(result).toContain('base');
  });

  it('handles empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});