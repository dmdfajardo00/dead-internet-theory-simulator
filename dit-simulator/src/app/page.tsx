'use client';

import { useAppStore } from '@/stores/appStore';
import { MainPanel } from '@/components/layout/MainPanel';
import { Sidebar } from '@/components/layout/Sidebar';

export default function Home() {
  const activeTab = useAppStore((state) => state.activeTab);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-5xl font-black text-gray-900 mb-6 text-center tracking-wider" style={{fontFamily: 'monospace', textShadow: '2px 2px 0px #000000', letterSpacing: '0.1em'}}>
          Dead Internet Theory Simulator
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel - Facebook-style interface */}
          <div className="lg:col-span-2">
            <MainPanel />
          </div>
          
          {/* Sidebar - Orchestrator/Edit Text */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
