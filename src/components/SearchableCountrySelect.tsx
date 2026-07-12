'use client';

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { countries, filterCountries, getCountryByCode } from '@/lib/countries';

export default function SearchableCountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = getCountryByCode(value);
  const filtered = filterCountries(query);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  function handleSelect(code: string) {
    onChange(code);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 bg-white border border-border rounded-md px-3 py-2 text-sm text-left text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
      >
        {selected ? (
          <>
            <span className="text-base leading-none">{selected.flag}</span>
            <span>{selected.name}</span>
            <span className="text-gray-400 ml-auto">{selected.code}</span>
          </>
        ) : (
          <span className="text-gray-400">Select country</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-border rounded-lg shadow-xl z-50">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search countries..."
                className="w-full bg-gray-50 border border-border rounded-md pl-8 pr-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">No countries found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    value === c.code ? 'bg-brand/5 text-brand font-medium' : 'text-gray-800'
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="ml-auto text-gray-400">{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
