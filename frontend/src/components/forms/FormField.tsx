import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  'aria-describedby'?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  className,
  'aria-describedby': ariaDescribedBy,
}) => {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const describedBy = [ariaDescribedBy, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  const commonProps = {
    id: fieldId,
    name,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      onChange(e.target.value),
    'aria-describedby': describedBy,
    'aria-invalid': error ? ('true' as const) : ('false' as const),
    'aria-required': required,
    placeholder,
    className: cn(
      error && 'border-destructive focus:ring-destructive',
      className
    ),
  };

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={fieldId}
        className={cn(
          required && "after:content-['*'] after:ml-0.5 after:text-destructive"
        )}
      >
        {label}
      </Label>
      
      {type === 'textarea' ? (
        <Textarea {...commonProps} />
      ) : (
        <Input 
          {...commonProps}
          type={type}
        />
      )}
      
      {error && (
        <Alert variant="destructive" id={errorId} className="py-2">
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};