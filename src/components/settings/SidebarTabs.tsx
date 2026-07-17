'use client';

import { Settings, Palette, Mail, Shield, FileText, Database, LogOut } from 'lucide-react';
import { Tab } from '@/types/settings';
import { signOut } from '@/lib/api/settings';
import { useRouter } from 'next/navigation';

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings size={16} /> },
  { id: 'branding', label: 'Branding', icon: <Palette size={16} /> },
  { id: 'smtp', label: 'Vendor SMTP Settings', icon: <Mail size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'plans', label: 'Subscription Plans', icon: <FileText size={16} /> },
  { id: 'payment', label: 'Payment Gateway', icon: <Database size={16} /> },
  { id: 'audit', label: 'Audit Log', icon: <FileText size={16} /> },
];

export default function SidebarTabs({ activeTab, onTabChange }: Props) {
  const router = useRouter();

  return (
    <nav className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 sticky top-24">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === tab.id
              ? 'bg-brand-light text-brand'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <span className={activeTab === tab.id ? 'text-brand' : 'text-gray-400'}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
      <hr className="my-2 border-gray-100" />
      <button
        onClick={async () => {
          await signOut();
          router.push('/admin/login');
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <LogOut size={16} />
        Logout
      </button>
    </nav>
  );
}
