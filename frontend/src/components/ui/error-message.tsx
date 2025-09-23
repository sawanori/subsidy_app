import React from 'react';
import { AlertTriangle, X, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type ErrorMessageVariant = 'error' | 'warning' | 'info' | 'success';

interface ErrorMessageProps {
  message: string;
  variant?: ErrorMessageVariant;
  onDismiss?: () => void;
  className?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  id?: string;
}

const variantConfig = {
  error: {
    icon: AlertTriangle,
    className: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100',
    iconClassName: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100',
    iconClassName: 'text-green-600 dark:text-green-400',
  },
} as const;

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  variant = 'error',
  onDismiss,
  className,
  'aria-live': ariaLive = variant === 'error' ? 'assertive' : 'polite',
  id,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Alert
      id={id}
      className={cn(
        config.className,
        'relative pr-12', // Space for dismiss button
        className
      )}
      role="alert"
      aria-live={ariaLive}
    >
      <div className="flex items-start space-x-3">
        <Icon
          className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClassName)}
          aria-hidden="true"
        />
        <AlertDescription className="flex-grow text-sm font-medium leading-5">
          {message}
        </AlertDescription>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'absolute right-3 top-3 rounded-md p-1.5 transition-colors',
              'hover:bg-black/10 dark:hover:bg-white/10',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              variant === 'error' && 'focus:ring-red-500',
              variant === 'warning' && 'focus:ring-amber-500',
              variant === 'info' && 'focus:ring-blue-500',
              variant === 'success' && 'focus:ring-green-500',
              config.iconClassName
            )}
            aria-label="メッセージを閉じる"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </Alert>
  );
};

export default ErrorMessage;