'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useKeyboard } from '@/hooks/useKeyboard';

interface AccessibleButtonProps extends React.ComponentProps<"button"> {
  onActivate?: () => void;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  role?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    children, 
    onClick, 
    onActivate, 
    className, 
    disabled,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-haspopup': ariaHaspopup,
    role,
    ...props 
  }, ref) => {
    const handleActivate = () => {
      if (disabled) return;
      onActivate?.();
    };

    useKeyboard({
      onEnter: handleActivate,
      onSpace: handleActivate,
      enabled: !disabled,
    });

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(e);
      onActivate?.();
    };

    return (
      <Button
        ref={ref}
        className={cn('min-target', className)}
        onClick={handleClick}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        role={role}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';