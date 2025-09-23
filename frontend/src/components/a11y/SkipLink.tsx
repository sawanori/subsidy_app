import React from 'react';
import { a11y } from '@/lib/accessibility';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a 
      href={href}
      className="skip-link"
      style={a11y.skipLink}
    >
      {children}
    </a>
  );
};

export default SkipLink;