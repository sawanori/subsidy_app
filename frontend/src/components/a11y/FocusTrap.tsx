'use client';

import React, { useEffect, useRef } from 'react';
import { useFocusManagement } from '@/hooks/useFocusManagement';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  initialFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  initialFocus = true,
  restoreFocus = true,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { saveFocus, restoreFocus: restoreFocusFn, trapFocus, focusFirstElement } = useFocusManagement();

  useEffect(() => {
    if (!active) return;

    // Save current focus
    if (restoreFocus) {
      saveFocus();
    }

    // Focus first element if requested
    if (initialFocus) {
      focusFirstElement(containerRef);
    }

    // Trap focus within container
    const cleanup = trapFocus(containerRef);

    return () => {
      cleanup?.();
      if (restoreFocus) {
        restoreFocusFn();
      }
    };
  }, [active, initialFocus, restoreFocus, saveFocus, restoreFocusFn, trapFocus, focusFirstElement]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-focus-trap={active}
    >
      {children}
    </div>
  );
};