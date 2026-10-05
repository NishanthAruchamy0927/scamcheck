import React from 'react';
import { ShieldCheck, Layers, GitCompare, LayoutDashboard, History, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'investigate' | 'compare' | 'dashboard' | 'demos' | 'history';
  setActiveTab: (tab: 'investigate' | 'compare' | 'dashboard' | 'demos' | 'history') => void;
  historyCount: number;
  isBackendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  isBackendHealthy
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#07090e]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('investigate')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-slate-800 to-slate-900 border border-cyan-500/40 group-hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <ShieldCheck className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-xl bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                  SCAMCHECK
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300">
                  AI INTEL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                AI Opportunity Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('investigate')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'investigate'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Investigate</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'compare'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('demos')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'demos'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Demo Mode</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all relative ${
                activeTab === 'history'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-700 text-slate-200">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>

          {/* Engine Status Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] font-mono text-slate-300">
                {isBackendHealthy ? 'ENGINE ACTIVE' : 'CLIENT MODE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel bg-[#07090e]/95 border-t border-slate-800/90 py-1.5 px-2">
        <div className="grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => setActiveTab('investigate')}
            className={`flex flex-col items-center py-1 rounded-lg text-[10px] font-medium transition-all ${
              activeTab === 'investigate' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span>Investigate</span>
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`flex flex-col items-center py-1 rounded-lg text-[10px] font-medium transition-all ${
              activeTab === 'compare' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-4 h-4 mb-0.5" />
            <span>Compare</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 rounded-lg text-[10px] font-medium transition-all ${
              activeTab === 'dashboard' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('demos')}
            className={`flex flex-col items-center py-1 rounded-lg text-[10px] font-medium transition-all ${
              activeTab === 'demos' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span>Demos</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1 rounded-lg text-[10px] font-medium transition-all relative ${
              activeTab === 'history' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="absolute top-0.5 right-2 px-1 py-0.1 text-[8px] font-bold rounded-full bg-cyan-600 text-white">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
