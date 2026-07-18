'use client';

import { useEffect, useState } from 'react';
import { Tags, CheckCircle, XCircle } from 'lucide-react';
import { getIndustryPreset, getAllIndustryKeys } from '@/lib/industry-presets';

function Section({ icon: Icon, title, desc, children }: { icon: any; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          {desc && <p className="text-xs text-gray-500">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function InventorySettingsPage() {
  const [industries, setIndustries] = useState<string[]>([]);
  const [customFieldTemplates, setCustomFieldTemplates] = useState<{ name: string; type: string; options?: string[] }[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);
  const [togglingCat, setTogglingCat] = useState<string | null>(null);

  async function toggleActive(cat: any) {
    setTogglingCat(cat.id);
    try {
      await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, active: !cat.active }),
      });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, active: !c.active } : c));
    } catch {}
    setTogglingCat(null);
  }

  const fetchCompany = () => {
    setLoading(true);
    setError('');
    fetch('/api/company')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load settings'))
      .then(data => {
        setIndustries(data.industries || []);
        setCustomFieldTemplates(data.custom_field_templates || []);
        setFetched(true);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompany(); fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {}
  };

  const handleSetIndustries = async (nextIndustries: string[]) => {
    const allTemplates: { name: string; type: string }[] = [];
    const seen = new Set<string>();
    for (const ind of nextIndustries) {
      const p = getIndustryPreset(ind);
      if (p) {
        for (const f of p.customFields || []) {
          const key = `${f.name}|${f.type}`;
          if (!seen.has(key)) {
            seen.add(key);
            allTemplates.push(f);
          }
        }
      }
    }
    setIndustries(nextIndustries);
    setCustomFieldTemplates(allTemplates);

    try {
      await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industries: nextIndustries, custom_field_templates: allTemplates }),
      });
    } catch {}

    try {
      await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    } catch {}

    for (const ind of nextIndustries) {
      const p = getIndustryPreset(ind);
      if (p) {
        for (const cat of p.categories || []) {
          try {
            const res = await fetch('/api/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: cat.name, industry: ind }),
            });
            if (res.ok) {
              const parent = await res.json();
              for (const child of cat.children || []) {
                await fetch('/api/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: child.name, parent_id: parent.id, industry: ind }),
                });
              }
            }
          } catch {}
        }
      }
    }
    fetchCategories();
  };

  if (error && !fetched) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load settings</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchCompany} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
          <Tags className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Inventory Settings</h1>
          <p className="text-xs text-gray-500">Configure industries, categories, and custom fields for inventory</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <span className="text-sm text-gray-600">Loading settings...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-5 max-w-2xl">
          <Section icon={Tags} title="Industry & Categories" desc="Configure your business type and inventory categories">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Industries</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {getAllIndustryKeys().map(ind => (
                  <label key={ind} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${industries.includes(ind) ? 'border-brand bg-brand/5' : 'border-border hover:border-gray-300'}`}>
                    <input type="checkbox" checked={industries.includes(ind)} onChange={() => {
                      const next = industries.includes(ind)
                        ? industries.filter(i => i !== ind)
                        : [...industries, ind];
                      handleSetIndustries(next);
                    }} className="rounded border-gray-300 text-brand focus:ring-brand" />
                    <span className="text-gray-800">{ind.charAt(0).toUpperCase() + ind.slice(1)}</span>
                  </label>
                ))}
              </div>
              {industries.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Presets will auto-create default categories and custom fields based on your selected industries.
                </p>
              )}
            </div>

            {customFieldTemplates.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Custom Fields</label>
                <div className="flex flex-wrap gap-2">
                  {customFieldTemplates.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {f.name} <span className="text-blue-400">({f.type})</span>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Custom fields appear on inventory item forms. Change industries to reset.</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</label>
                <p className="text-xs text-gray-400">Tick the categories you stock. Unticked categories won't appear when adding items.</p>
              </div>
              {industries.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Select industries above to see their preset categories.</p>
              ) : categories.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No categories found. Change your industry selection above.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto border border-border rounded-lg p-2 space-y-3">
                  {industries.map(ind => {
                    const indCats = categories.filter(c => c.industry === ind);
                    if (indCats.length === 0) return null;
                    return (
                      <div key={ind}>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{ind}</h4>
                        {(() => {
                          const renderIndTree = (parentId: string | null, depth: number) =>
                            indCats
                              .filter(c => (c.parent_id || null) === parentId)
                              .map(cat => (
                                <div key={cat.id}>
                                  <label className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 text-sm ${!cat.active ? 'opacity-50' : ''}`}
                                    style={{ paddingLeft: `${8 + depth * 20}px` }}>
                                    <input type="checkbox" checked={cat.active !== false}
                                      onChange={() => toggleActive(cat)}
                                      disabled={togglingCat === cat.id}
                                      className="rounded border-gray-300 text-brand focus:ring-brand" />
                                    <span className="text-gray-700">{cat.name}</span>
                                  </label>
                                  {renderIndTree(cat.id, depth + 1)}
                                </div>
                              ));
                          return renderIndTree(null, 0);
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
              {categories.filter(c => c.active !== false).length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {categories.filter(c => c.active !== false).length} active categories — visible when adding items
                </div>
              )}
              {categories.filter(c => c.active === false).length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <XCircle className="h-3 w-3 text-gray-300" />
                  {categories.filter(c => c.active === false).length} inactive — hidden from item forms
                </div>
              )}
            </div>
          </Section>
        </div>
      )}

    </div>
  );
}
