'use client';

import { useAppStore } from '@/stores/appStore';

export function TabNavigation() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="flex border-b border-[var(--ig-border)]">
      <button
        onClick={() => setActiveTab('orchestrator')}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
          activeTab === 'orchestrator'
            ? 'text-[var(--ig-fg)] border-b-2 border-[var(--ig-fg)]'
            : 'text-[var(--ig-muted)] hover:text-[var(--ig-fg)]'
        }`}
      >
        Orchestrator
      </button>
      <button
        onClick={() => setActiveTab('editText')}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
          activeTab === 'editText'
            ? 'text-[var(--ig-fg)] border-b-2 border-[var(--ig-fg)]'
            : 'text-[var(--ig-muted)] hover:text-[var(--ig-fg)]'
        }`}
      >
        Edit Text
      </button>
    </div>
  );
}