'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { ErrorMessage, ErrorMessageVariant } from '@/components/ui/error-message';

interface ToastItem {
  id: string;
  message: string;
  variant: ErrorMessageVariant;
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  toast: (message: string, variant?: ErrorMessageVariant, options?: { duration?: number; persistent?: boolean }) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((
    message: string,
    variant: ErrorMessageVariant = 'info',
    options: { duration?: number; persistent?: boolean } = {}
  ): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const { duration = 5000, persistent = false } = options;

    const newToast: ToastItem = {
      id,
      message,
      variant,
      duration: persistent ? undefined : duration,
      persistent,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after duration (unless persistent)
    if (!persistent) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "relative overflow-hidden rounded-lg border p-4 pr-6 shadow-lg transition-all",
            "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
            "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[swipe=end]:animate-out data-[state=closed]:fade-out-80",
            "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
            "data-[state=open]:sm:slide-in-from-bottom-full"
          )}
        >
          <ErrorMessage
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => onDismiss(toast.id)}
            aria-live="assertive"
            id={`toast-${toast.id}`}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};