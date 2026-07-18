'use client';

import { useEffect, useState } from 'react';
import { Tags, Trash2, Pencil } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
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
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: '', parent_id: '' });
  const { confirm, dialog } = useConfirm();

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
              body: JSON.stringify({ name: cat.name }),
            });
            if (res.ok) {
              const parent = await res.json();
              for (const child of cat.children || []) {
                await fetch('/api/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: child.name, parent_id: parent.id }),
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
                <button onClick={() => { setEditingCategory(null); setCatForm({ name: '', parent_id: '' }); }} className="text-xs text-brand font-medium hover:underline">+ Add Category</button>
              </div>

              {editingCategory !== undefined && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg border border-border">
                  {!editingCategory && industries.length > 0 && getIndustryPreset(industries[0]) ? (
                    <select value={catForm.name} onChange={e => {
                      const name = e.target.value;
                      const p = getIndustryPreset(industries[0]);
                      let parentId = '';
                      if (p) {
                        for (const parent of p.categories) {
                          if (parent.children) {
                            const child = parent.children.find(ch => ch.name === name);
                            if (child) {
                              const existingParent = categories.find(c => c.name === parent.name && !c.parent_id);
                              if (existingParent) parentId = existingParent.id;
                              break;
                            }
                          }
                          if (parent.name === name) break;
                        }
                      }
                      setCatForm({ name, parent_id: parentId });
                    }} className="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-white">
                      <option value="">Select category...</option>
                      {(() => {
                        const p = getIndustryPreset(industries[0]);
                        if (!p) return null;
                        const opts: { name: string; parent: string }[] = [];
                        for (const parent of p.categories) {
                          opts.push({ name: parent.name, parent: '' });
                          for (const child of parent.children || []) {
                            opts.push({ name: child.name, parent: parent.name });
                          }
                        }
                        return opts.map(o => (
                          <option key={o.name} value={o.name}>{o.parent ? `— ${o.name}` : o.name}</option>
                        ));
                      })()}
                    </select>
                  ) : (
                    <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="Category name" className="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-white" />
                  )}
                  {categories.filter(c => !c.parent_id).length > 0 && (
                    <select value={catForm.parent_id} onChange={e => setCatForm({ ...catForm, parent_id: e.target.value })}
                      className="border border-border rounded px-2 py-1.5 text-sm bg-white">
                      <option value="">Root (no parent)</option>
                      {categories.filter(c => !c.parent_id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  <button onClick={async () => {
                    if (!catForm.name) return;
                    const method = editingCategory ? 'PUT' : 'POST';
                    const body = editingCategory ? { ...catForm, id: editingCategory.id } : catForm;
                    await fetch('/api/categories', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                    setEditingCategory(undefined);
                    fetchCategories();
                  }} className="px-3 py-1.5 bg-brand text-white text-xs rounded-lg font-medium">Save</button>
                  <button onClick={() => setEditingCategory(undefined)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
                </div>
              )}

              <div className="space-y-1 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
                {categories.filter(c => !c.parent_id).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No categories. Select an industry above or add one manually.</p>
                )}
                {categories.filter(c => !c.parent_id).map(parent => (
                  <div key={parent.id}>
                    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 group">
                      <span className="text-sm font-medium text-gray-700">{parent.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => { setEditingCategory(parent); setCatForm({ name: parent.name, parent_id: parent.parent_id || '' }); }} className="p-0.5 hover:text-brand"><Pencil className="h-3 w-3" /></button>
                        <button onClick={async () => {
                          if (!await confirm(`Delete "${parent.name}"?`)) return;
                          await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: parent.id }) });
                          fetchCategories();
                        }} className="p-0.5 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    {categories.filter(c => c.parent_id === parent.id).map(child => (
                      <div key={child.id} className="flex items-center justify-between py-1 pl-6 pr-2 rounded hover:bg-gray-50 group">
                        <span className="text-sm text-gray-600">— {child.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button onClick={() => { setEditingCategory(child); setCatForm({ name: child.name, parent_id: child.parent_id || '' }); }} className="p-0.5 hover:text-brand"><Pencil className="h-3 w-3" /></button>
                          <button onClick={async () => {
                            if (!await confirm(`Delete "${child.name}"?`)) return;
                            await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: child.id }) });
                            fetchCategories();
                          }} className="p-0.5 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      )}

      {dialog}
    </div>
  );
}
