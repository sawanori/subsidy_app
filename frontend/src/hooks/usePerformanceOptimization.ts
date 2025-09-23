import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * APP-240: プレビュー差分再描画/キャッシュ最適化
 * パフォーマンス最適化フック集
 */

// Virtual DOM差分計算用のキャッシュ
interface VirtualDOMCache<T> {
  data: T;
  computed: any;
  hash: string;
}

/**
 * 計算コストの高い処理を最適化するフック
 */
export function useExpensiveComputation<T, R>(
  data: T,
  computeFn: (data: T) => R,
  dependencies: React.DependencyList = []
): R {
  const cache = useRef<VirtualDOMCache<R> | null>(null);
  
  // データのハッシュ化（差分検出用）
  const dataHash = useMemo(() => {
    return JSON.stringify(data);
  }, [data]);
  
  return useMemo(() => {
    // キャッシュヒット判定
    if (cache.current && cache.current.hash === dataHash) {
      return cache.current.computed;
    }
    
    // 新規計算実行
    const result = computeFn(data);
    
    // キャッシュ更新
    cache.current = {
      data: data,
      computed: result,
      hash: dataHash
    };
    
    return result;
  }, [dataHash, ...dependencies]);
}

/**
 * レンダリング最適化用のデバウンスフック
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Virtual Scrolling用のビューポート計算フック
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [items, visibleRange, itemHeight]);
  
  const totalHeight = items.length * itemHeight;
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange
  };
}

/**
 * React.memo用の等価性判定関数生成
 */
export function createMemoComparison<T extends Record<string, any>>(
  keys: (keyof T)[]
) {
  return (prevProps: T, nextProps: T): boolean => {
    // 指定されたキーのみ比較
    for (const key of keys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    return true;
  };
}

/**
 * パフォーマンス監視フック
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef<number>(0);
  
  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;
      
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }
    };
  });
  
  return {
    renderCount: renderCount.current,
    markStart: () => { startTime.current = performance.now(); },
    markEnd: (label?: string) => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName}${label ? ` ${label}` : ''}: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  };
}

/**
 * バッチ更新最適化フック
 */
export function useBatchedUpdates<T>(
  initialState: T,
  batchSize: number = 10,
  delay: number = 100
) {
  const [state, setState] = React.useState<T>(initialState);
  const pendingUpdates = useRef<((prev: T) => T)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const flushUpdates = useCallback(() => {
    if (pendingUpdates.current.length === 0) return;
    
    setState(prevState => {
      return pendingUpdates.current.reduce((acc, updateFn) => updateFn(acc), prevState);
    });
    
    pendingUpdates.current = [];
  }, []);
  
  const batchedUpdate = useCallback((updateFn: (prev: T) => T) => {
    pendingUpdates.current.push(updateFn);
    
    // バッチサイズに達したら即座に実行
    if (pendingUpdates.current.length >= batchSize) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      flushUpdates();
      return;
    }
    
    // タイマーベースの遅延実行
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        flushUpdates();
        timeoutRef.current = undefined;
      }, delay);
    }
  }, [batchSize, delay, flushUpdates]);
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        flushUpdates();
      }
    };
  }, [flushUpdates]);
  
  return [state, batchedUpdate] as const;
}

// React import fix
import React from 'react';