'use client';

import { MainPanel } from '@/components/layout/MainPanel';
import { Sidebar } from '@/components/layout/Sidebar';
import Image from 'next/image';

export default function Home() {

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center mb-6 gap-4">
          <Image 
            src="/logo.png" 
            alt="Dead Internet Theory Simulator Logo" 
            width={80} 
            height={80} 
            className="flex-shrink-0"
          />
          <h1 className="text-5xl font-black text-gray-900 text-center tracking-wider" style={{fontFamily: 'monospace', textShadow: '2px 2px 0px #000000', letterSpacing: '0.1em'}}>
            Dead Internet Theory Simulator
          </h1>
        </div>
        
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
