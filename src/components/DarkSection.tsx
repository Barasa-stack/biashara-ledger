import type { ReactNode } from 'react';

interface DarkSectionProps {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div';
}

export default function DarkSection({ children, className = '', as: Tag = 'section' }: DarkSectionProps) {
  return (
    <Tag className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#0a0a0a] to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/15 via-transparent to-transparent" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand/10 blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand/5 blur-[120px]" />
      </div>
      <div className="relative">
        {children}
      </div>
    </Tag>
  );
}
