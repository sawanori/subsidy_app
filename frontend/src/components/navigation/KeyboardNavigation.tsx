'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useKeyboard } from '@/hooks/useKeyboard';

interface KeyboardNavigationProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  wrap?: boolean;
  className?: string;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  orientation = 'horizontal',
  wrap = true,
  className,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const childRefs = useRef<(HTMLElement | null)[]>([]);

  const focusableChildren = React.Children.toArray(children).filter(
    child => React.isValidElement(child)
  );

  const moveFocus = (direction: 'next' | 'prev' | 'first' | 'last') => {
    const maxIndex = focusableChildren.length - 1;
    let newIndex = focusedIndex;

    switch (direction) {
      case 'next':
        newIndex = focusedIndex < maxIndex ? focusedIndex + 1 : wrap ? 0 : maxIndex;
        break;
      case 'prev':
        newIndex = focusedIndex > 0 ? focusedIndex - 1 : wrap ? maxIndex : 0;
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = maxIndex;
        break;
    }

    setFocusedIndex(newIndex);
    childRefs.current[newIndex]?.focus();
  };

  const keyHandlers = orientation === 'horizontal' ? {
    onArrowLeft: () => moveFocus('prev'),
    onArrowRight: () => moveFocus('next'),
    onHome: () => moveFocus('first'),
    onEnd: () => moveFocus('last'),
  } : {
    onArrowUp: () => moveFocus('prev'),
    onArrowDown: () => moveFocus('next'),
    onHome: () => moveFocus('first'),
    onEnd: () => moveFocus('last'),
  };

  useKeyboard(keyHandlers);

  const enhancedChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;

    const childProps = {
      ref: (el: HTMLElement | null) => {
        childRefs.current[index] = el;
      },
      tabIndex: index === focusedIndex ? 0 : -1,
      onFocus: () => setFocusedIndex(index),
      'aria-setsize': focusableChildren.length,
      'aria-posinset': index + 1,
    };

    return React.cloneElement(child, childProps);
  });

  useEffect(() => {
    // Focus the first child initially
    if (childRefs.current[focusedIndex]) {
      childRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  return (
    <div
      ref={containerRef}
      className={className}
      role={orientation === 'horizontal' ? 'menubar' : 'menu'}
      aria-orientation={orientation}
    >
      {enhancedChildren}
    </div>
  );
};