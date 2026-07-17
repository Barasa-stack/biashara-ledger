'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface FieldTooltipProps {
  text: string;
}

export default function FieldTooltip({ text }: FieldTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center ml-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        aria-label="Help"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-[60] w-60 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-2.5 leading-relaxed">
          {text}
          <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </span>
  );
}
