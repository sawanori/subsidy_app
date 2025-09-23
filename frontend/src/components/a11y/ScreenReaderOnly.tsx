import React from 'react';
import { a11y } from '@/lib/accessibility';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: React.ElementType;
  [key: string]: unknown;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ 
  children, 
  as: Component = 'span',
  ...props 
}) => {
  return (
    <Component 
      style={a11y.srOnly}
      {...props}
    >
      {children}
    </Component>
  );
};

export default ScreenReaderOnly;