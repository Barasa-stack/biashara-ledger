import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, ComposedChart, CartesianGrid, Legend, Cell,
} from 'recharts';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function RevenueChart({ data }: { data?: { month: string; incoming: number; outgoing: number; profit: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#999" />
        <YAxis tick={{ fontSize: 11 }} stroke="#999" />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
        <Legend />
        <Bar dataKey="incoming" fill="#1e3a5f" name="Revenue" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="profit" stroke="#27ae60" strokeWidth={2} name="Profit" dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function CashFlowChart({ data }: { data?: { month: string; incoming: number; outgoing: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#999" />
        <YAxis tick={{ fontSize: 11 }} stroke="#999" />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
        <Legend />
        <Bar dataKey="incoming" fill="#1e3a5f" name="Inflow" radius={[4, 4, 0, 0]} />
        <Bar dataKey="outgoing" fill="#e74c3c" name="Outflow" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProfitLossChart({ data }: { data?: { month: string; profit: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#999" />
        <YAxis tick={{ fontSize: 11 }} stroke="#999" />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
        <Legend />
        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? '#27ae60' : '#e74c3c'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
