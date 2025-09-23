/**
 * APP-100: usePerformanceOptimization フック単体テスト
 * APP-240最適化機能の品質保証
 */

import { renderHook, act } from '@testing-library/react';
import {
  useExpensiveComputation,
  useDebounce,
  useVirtualScroll,
  createMemoComparison,
  usePerformanceMonitor,
  useBatchedUpdates
} from '../usePerformanceOptimization';

describe('usePerformanceOptimization', () => {
  
  describe('useExpensiveComputation', () => {
    test('caches expensive computations correctly', () => {
      const expensiveFunction = jest.fn((data: number) => data * 2);
      
      const { result, rerender } = renderHook(
        ({ data }) => useExpensiveComputation(data, expensiveFunction),
        { initialProps: { data: 5 } }
      );
      
      expect(result.current).toBe(10);
      expect(expensiveFunction).toHaveBeenCalledTimes(1);
      
      // 同じデータでの再レンダリング（キャッシュヒット）
      rerender({ data: 5 });
      expect(expensiveFunction).toHaveBeenCalledTimes(1); // キャッシュされているので呼ばれない
      
      // 異なるデータでの再レンダリング（キャッシュミス）
      rerender({ data: 10 });
      expect(result.current).toBe(20);
      expect(expensiveFunction).toHaveBeenCalledTimes(2);
    });

    test('handles complex objects correctly', () => {
      const complexFunction = jest.fn((obj: any) => Object.keys(obj).length);
      
      const { result, rerender } = renderHook(
        ({ data }) => useExpensiveComputation(data, complexFunction),
        { initialProps: { data: { a: 1, b: 2 } } }
      );
      
      expect(result.current).toBe(2);
      expect(complexFunction).toHaveBeenCalledTimes(1);
      
      // 同じ構造のオブジェクト（キャッシュヒット）
      rerender({ data: { a: 1, b: 2 } });
      expect(complexFunction).toHaveBeenCalledTimes(1);
      
      // 異なるオブジェクト（キャッシュミス）
      rerender({ data: { a: 1, b: 2, c: 3 } });
      expect(result.current).toBe(3);
      expect(complexFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('useDebounce', () => {
    jest.useFakeTimers();

    test('debounces values correctly', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );
      
      expect(result.current).toBe('initial');
      
      // 値を変更
      rerender({ value: 'updated' });
      expect(result.current).toBe('initial'); // まだdebounce中
      
      // 時間経過
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(result.current).toBe('updated');
    });

    test('cancels previous timeout on new value', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'first' } }
      );
      
      rerender({ value: 'second' });
      
      // 途中で時間経過
      act(() => {
        jest.advanceTimersByTime(250);
      });
      
      rerender({ value: 'third' });
      
      // 最初のタイムアウト分の時間経過
      act(() => {
        jest.advanceTimersByTime(250);
      });
      
      expect(result.current).toBe('first'); // 最初の値のまま
      
      // 追加の250ms経過で'third'になる
      act(() => {
        jest.advanceTimersByTime(250);
      });
      
      expect(result.current).toBe('third');
    });
  });

  describe('useVirtualScroll', () => {
    const mockItems = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
    const itemHeight = 50;
    const containerHeight = 400;

    test('calculates visible range correctly', () => {
      const { result } = renderHook(() =>
        useVirtualScroll(mockItems, itemHeight, containerHeight)
      );
      
      expect(result.current.visibleItems.length).toBeLessThan(mockItems.length);
      expect(result.current.totalHeight).toBe(mockItems.length * itemHeight);
    });

    test('updates visible items on scroll', () => {
      const { result } = renderHook(() =>
        useVirtualScroll(mockItems, itemHeight, containerHeight)
      );
      
      const initialRange = result.current.visibleRange;
      
      // スクロールシミュレーション
      act(() => {
        const mockEvent = {
          currentTarget: { scrollTop: 500 }
        } as React.UIEvent<HTMLDivElement>;
        
        result.current.handleScroll(mockEvent);
      });
      
      const newRange = result.current.visibleRange;
      expect(newRange.startIndex).toBeGreaterThan(initialRange.startIndex);
    });

    test('includes overscan items', () => {
      const overscan = 3;
      const { result } = renderHook(() =>
        useVirtualScroll(mockItems, itemHeight, containerHeight, overscan)
      );
      
      const expectedVisible = Math.ceil(containerHeight / itemHeight);
      expect(result.current.visibleItems.length).toBeGreaterThanOrEqual(expectedVisible);
    });
  });

  describe('createMemoComparison', () => {
    test('compares only specified keys', () => {
      const comparison = createMemoComparison(['a', 'c']);
      
      const props1 = { a: 1, b: 2, c: 3 };
      const props2 = { a: 1, b: 999, c: 3 }; // bが変更されたが比較対象外
      const props3 = { a: 999, b: 2, c: 3 }; // aが変更された
      
      expect(comparison(props1, props2)).toBe(true);  // 等しい
      expect(comparison(props1, props3)).toBe(false); // 異なる
    });

    test('handles missing keys gracefully', () => {
      const comparison = createMemoComparison(['a', 'missing']);
      
      const props1 = { a: 1 };
      const props2 = { a: 1 };
      
      expect(comparison(props1, props2)).toBe(true);
    });
  });

  describe('usePerformanceMonitor', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    beforeEach(() => {
      consoleSpy.mockClear();
      consoleWarnSpy.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    test('tracks render count in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const { rerender } = renderHook(() => 
        usePerformanceMonitor('TestComponent')
      );
      
      rerender();
      rerender();
      
      expect(consoleSpy).toHaveBeenCalledWith('TestComponent rendered 3 times');
      
      process.env.NODE_ENV = originalEnv;
    });

    test('measures performance timing', () => {
      const { result } = renderHook(() => 
        usePerformanceMonitor('TestComponent')
      );
      
      result.current.markStart();
      const duration = result.current.markEnd('test operation');
      
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('useBatchedUpdates', () => {
    jest.useFakeTimers();

    test('batches updates correctly', () => {
      const { result } = renderHook(() => 
        useBatchedUpdates(0, 3, 100)
      );
      
      const [state, batchedUpdate] = result.current;
      expect(state).toBe(0);
      
      // 複数の更新をバッチ
      act(() => {
        batchedUpdate(prev => prev + 1);
        batchedUpdate(prev => prev + 2);
        batchedUpdate(prev => prev + 3);
      });
      
      // バッチサイズに達したので即座に実行される
      expect(result.current[0]).toBe(6);
    });

    test('flushes updates after delay', () => {
      const { result } = renderHook(() => 
        useBatchedUpdates(0, 5, 100)
      );
      
      const [, batchedUpdate] = result.current;
      
      act(() => {
        batchedUpdate(prev => prev + 1);
        batchedUpdate(prev => prev + 2);
      });
      
      // バッチサイズに達していないので更新されない
      expect(result.current[0]).toBe(0);
      
      // 時間経過で更新される
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(result.current[0]).toBe(3);
    });
  });

  describe('Performance Benchmarks', () => {
    test('expensive computation performs within limits', () => {
      const heavyComputation = (data: number[]) => {
        return data.reduce((sum, num) => sum + Math.sqrt(num), 0);
      };
      
      const largeData = Array.from({ length: 10000 }, (_, i) => i);
      
      const startTime = Date.now();
      
      const { result } = renderHook(() =>
        useExpensiveComputation(largeData, heavyComputation)
      );
      
      const computationTime = Date.now() - startTime;
      
      expect(computationTime).toBeLessThan(1000); // 1秒以内
      expect(typeof result.current).toBe('number');
    });

    test('virtual scroll handles large datasets', () => {
      const massiveItems = Array.from({ length: 100000 }, (_, i) => `Item ${i}`);
      
      const startTime = Date.now();
      
      const { result } = renderHook(() =>
        useVirtualScroll(massiveItems, 30, 600)
      );
      
      const initTime = Date.now() - startTime;
      
      expect(initTime).toBeLessThan(100); // 100ms以内で初期化
      expect(result.current.visibleItems.length).toBeLessThan(100); // 可視項目は限定的
    });
  });

  describe('Memory Efficiency', () => {
    test('cleans up properly on unmount', () => {
      const { unmount } = renderHook(() => 
        useDebounce('test', 500)
      );
      
      // メモリリークがないことを確認（実際のメモリ測定は困難だが、エラーがないことを確認）
      expect(() => unmount()).not.toThrow();
    });

    test('cache size stays reasonable', () => {
      const computeFunction = jest.fn((x: number) => x * 2);
      
      const { rerender } = renderHook(
        ({ data }) => useExpensiveComputation(data, computeFunction),
        { initialProps: { data: 1 } }
      );
      
      // 大量のデータでキャッシュテスト
      for (let i = 1; i <= 100; i++) {
        rerender({ data: i });
      }
      
      // 計算回数がデータ数と一致することを確認（キャッシュが機能している）
      expect(computeFunction).toHaveBeenCalledTimes(100);
    });
  });
});