import { useEffect, useCallback } from 'react';
import { keys } from '@/lib/accessibility';

interface UseKeyboardOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onTab?: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

export const useKeyboard = (options: UseKeyboardOptions = {}) => {
  const {
    onEscape,
    onEnter,
    onSpace,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onTab,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't handle keys when user is typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    switch (event.key) {
      case keys.ESCAPE:
        onEscape?.();
        break;
      case keys.ENTER:
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
          onEnter?.();
        }
        break;
      case keys.SPACE:
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
          event.preventDefault();
          onSpace?.();
        }
        break;
      case keys.ARROW_UP:
        event.preventDefault();
        onArrowUp?.();
        break;
      case keys.ARROW_DOWN:
        event.preventDefault();
        onArrowDown?.();
        break;
      case keys.ARROW_LEFT:
        onArrowLeft?.();
        break;
      case keys.ARROW_RIGHT:
        onArrowRight?.();
        break;
      case keys.HOME:
        event.preventDefault();
        onHome?.();
        break;
      case keys.END:
        event.preventDefault();
        onEnd?.();
        break;
      case keys.TAB:
        onTab?.(event);
        break;
      default:
        break;
    }
  }, [
    enabled,
    onEscape,
    onEnter,
    onSpace,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onTab,
  ]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return { handleKeyDown };
};

export default useKeyboard;