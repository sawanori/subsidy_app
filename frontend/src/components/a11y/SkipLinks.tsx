import React from 'react';

interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

const defaultSkipLinks = [
  { href: '#main-content', label: 'メインコンテンツにスキップ' },
  { href: '#main-navigation', label: 'ナビゲーションにスキップ' },
  { href: '#search', label: '検索にスキップ' },
  { href: '#footer', label: 'フッターにスキップ' },
];

export const SkipLinks: React.FC<SkipLinksProps> = ({ 
  links = defaultSkipLinks 
}) => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      {links.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          className="skip-link"
        >
          {label}
        </a>
      ))}
    </div>
  );
};

export default SkipLinks;