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
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [addingUnder, setAddingUnder] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const { confirm, dialog } = useConfirm();

  function buildTree(parentId: string | null = null): any[] {
    return categories
      .filter(c => (c.parent_id || null) === parentId)
      .map(c => ({ ...c, children: buildTree(c.id) }));
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
                <button onClick={() => { setAddingUnder('__root__'); setNewCatName(''); }} className="text-xs text-brand font-medium hover:underline">+ Add Category</button>
              </div>

              {(() => {
                const tree = buildTree(null);
                if (tree.length === 0 && addingUnder !== '__root__') {
                  return <p className="text-xs text-gray-400 text-center py-4">No categories. Select an industry above or add one manually.</p>;
                }

                const renderNode = (node: any, depth: number) => {
                  const isEditing = editingCatId === node.id;
                  const isAdding = addingUnder === node.id;
                  return (
                    <div key={node.id}>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 group" style={{ paddingLeft: `${8 + depth * 20}px` }}>
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input value={editingCatName} onChange={e => setEditingCatName(e.target.value)}
                              className="flex-1 border border-border rounded px-2 py-1 text-sm bg-white" autoFocus />
                            <button onClick={async () => {
                              if (!editingCatName.trim()) return;
                              await fetch('/api/categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: node.id, name: editingCatName, parent_id: node.parent_id }) });
                              setEditingCatId(null);
                              fetchCategories();
                            }} className="px-2 py-1 bg-brand text-white text-xs rounded-lg font-medium">Save</button>
                            <button onClick={() => setEditingCatId(null)} className="text-xs text-gray-500">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-gray-700">{node.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                              <button onClick={() => { setEditingCatId(node.id); setEditingCatName(node.name); }} className="p-0.5 hover:text-brand"><Pencil className="h-3 w-3" /></button>
                              <button onClick={async () => {
                                if (!await confirm(`Delete "${node.name}"?`)) return;
                                await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: node.id }) });
                                fetchCategories();
                              }} className="p-0.5 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                              <button onClick={() => { setAddingUnder(node.id); setNewCatName(''); }} className="p-0.5 hover:text-brand text-xs font-medium">+sub</button>
                            </div>
                          </>
                        )}
                      </div>
                      {isAdding && (
                        <div className="flex items-center gap-2 py-1 px-2" style={{ paddingLeft: `${8 + (depth + 1) * 20}px` }}>
                          <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                            placeholder="Subcategory name" className="flex-1 border border-border rounded px-2 py-1 text-sm bg-white" autoFocus />
                          <button onClick={async () => {
                            if (!newCatName.trim()) return;
                            await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName, parent_id: node.id }) });
                            setAddingUnder(null);
                            fetchCategories();
                          }} className="px-2 py-1 bg-brand text-white text-xs rounded-lg font-medium">Add</button>
                          <button onClick={() => setAddingUnder(null)} className="text-xs text-gray-500">Cancel</button>
                        </div>
                      )}
                      {node.children.map((child: any) => renderNode(child, depth + 1))}
                    </div>
                  );
                };

                return (
                  <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2">
                    {addingUnder === '__root__' && (
                      <div className="flex items-center gap-2 mb-2" style={{ paddingLeft: '8px' }}>
                        <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                          placeholder="Category name" className="flex-1 border border-border rounded px-2 py-1 text-sm bg-white" autoFocus />
                        <button onClick={async () => {
                          if (!newCatName.trim()) return;
                          await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName }) });
                          setAddingUnder(null);
                          fetchCategories();
                        }} className="px-2 py-1 bg-brand text-white text-xs rounded-lg font-medium">Add</button>
                        <button onClick={() => setAddingUnder(null)} className="text-xs text-gray-500">Cancel</button>
                      </div>
                    )}
                    {tree.map((node: any) => renderNode(node, 0))}
                  </div>
                );
              })()}
            </div>
          </Section>
        </div>
      )}

      {dialog}
    </div>
  );
}
