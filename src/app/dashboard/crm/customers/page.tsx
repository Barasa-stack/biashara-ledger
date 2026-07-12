'use client';

import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';

type CRMCustomer = {
  id: string;
  customer_name: string;
  company_name: string;
  email_address: string;
  phone_number: string;
  country: string;
  created_at: string;
};

export default function CRMCustomersPage() {
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCustomers = () => {
    setLoading(true); setError('');
    fetch('/api/crm/customers')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load'))
      .then(setCustomers)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.customer_name || '').toLowerCase().includes(q) ||
      (c.email_address || '').toLowerCase().includes(q) ||
      (c.phone_number || '').toLowerCase().includes(q);
  });

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><p className="text-brand font-medium mb-2">Failed to load</p>
      <button onClick={fetchCustomers} className="text-sm text-brand font-medium">Retry</button></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center"><Users className="h-5 w-5 text-brand" /></div>
          <div><h1 className="text-lg font-semibold text-gray-800">CRM Customers</h1><p className="text-xs text-gray-500">Customers converted from leads via won deals</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 max-w-xs">
          <Search className="h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand w-full" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Email</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Phone</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-3">Country</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                <td className="py-3 pr-3 font-medium text-gray-800">{c.customer_name}</td>
                <td className="py-3 pr-3 text-gray-600">{c.email_address || '—'}</td>
                <td className="py-3 pr-3 text-gray-600">{c.phone_number || '—'}</td>
                <td className="py-3 pr-3 text-gray-600">{c.country || '—'}</td>
                <td className="py-3 text-gray-500 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="h-8 w-8 mb-2" />
            <p className="text-sm">{search ? 'No customers match your search' : 'No CRM customers yet. Convert a deal to won to create one.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
