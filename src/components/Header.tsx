import React from 'react';
import { 
  ShieldAlert, 
  BrainCircuit, 
  RotateCcw, 
  PlusCircle, 
  Layers, 
  GitCompare, 
  Activity,
  CheckCircle2,
  Terminal
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'incidents' | 'hindsight' | 'comparison';
  setActiveTab: (tab: 'incidents' | 'hindsight' | 'comparison') => void;
  memoryCount: number;
  activeIncidentCount: number;
  onOpenInjectModal: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  memoryCount,
  activeIncidentCount,
  onOpenInjectModal,
  onResetDemo,
  isResetting
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & SRE Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  HINDSIGHT
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  AI SRE Agent
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Memory
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Organizational Memory & Incident Response Autonomous Loop
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'incidents'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Incident Control</span>
              {activeIncidentCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  {activeIncidentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('hindsight')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'hindsight'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span>Hindsight Memory</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                {memoryCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'comparison'
                  ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/70 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GitCompare className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Memory Benchmark</span>
              <span className="md:hidden">Benchmark</span>
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenInjectModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Simulate Outage</span>
              <span className="sm:hidden">Inject</span>
            </button>

            <button
              onClick={onResetDemo}
              disabled={isResetting}
              title="Reset to clean Hackathon Demo state"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
