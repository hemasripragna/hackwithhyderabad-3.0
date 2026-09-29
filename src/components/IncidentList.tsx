import React from 'react';
import { Incident } from '../types/incident.ts';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  BrainCircuit, 
  Zap, 
  ShieldAlert,
  Server,
  Terminal,
  Activity
} from 'lucide-react';

interface IncidentListProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  onDiagnose: (id: string) => void;
  isDiagnosingId: string | null;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  onDiagnose,
  isDiagnosingId,
}) => {
  const [filter, setFilter] = React.useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'ACTIVE') return inc.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return inc.status === 'RESOLVED';
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    if (sev.includes('P1')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          P1 Critical
        </span>
      );
    }
    if (sev.includes('P2')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
          P2 High
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">
        {sev}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INVESTIGATING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Investigating
          </span>
        );
      case 'AWAITING_APPROVAL':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-indigo-400" />
            Awaiting Approval
          </span>
        );
      case 'ACTION_EXECUTING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
            Executing Patch
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="font-semibold text-sm text-slate-100 uppercase tracking-wide">
              Production Incidents
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {incidents.length}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'ALL' ? 'bg-slate-800 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'ACTIVE' ? 'bg-slate-800 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({incidents.filter(i => i.status !== 'RESOLVED').length})
            </button>
            <button
              onClick={() => setFilter('RESOLVED')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'RESOLVED' ? 'bg-slate-800 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved ({incidents.filter(i => i.status === 'RESOLVED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Incident List Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
        {filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No incidents found in this category.
          </div>
        ) : (
          filteredIncidents.map(inc => {
            const isSelected = selectedIncidentId === inc.id;
            const isDiagnosing = isDiagnosingId === inc.id;
            const hasRecalledMemory = !!inc.diagnosis?.recalledMemoryId;

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className={`p-3.5 rounded-lg transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                {/* Top row: ID, Severity, Status */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {inc.id}
                    </span>
                    {getSeverityBadge(inc.severity)}
                  </div>
                  <div>
                    {getStatusBadge(inc.status)}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm text-slate-100 line-clamp-1 mb-1">
                  {inc.title}
                </h3>

                {/* Service & Error signature */}
                <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800">
                    {inc.service}
                  </span>
                  <span className="truncate font-mono text-[11px] text-slate-400">
                    {inc.errorSignature}
                  </span>
                </div>

                {/* Metrics snapshot & Hindsight status */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-3 font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="text-slate-500">Err:</span>
                      <span className={parseFloat(inc.metrics.errorRate) > 10 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {inc.metrics.errorRate}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-slate-500">p99:</span>
                      <span className="text-slate-300">{inc.metrics.p99Latency}</span>
                    </span>
                  </div>

                  {hasRecalledMemory ? (
                    <div className="flex items-center gap-1 text-indigo-400 font-mono font-medium text-[10px] bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                      <BrainCircuit className="w-3 h-3" />
                      <span>{inc.diagnosis?.recalledMemoryId} ({inc.diagnosis?.confidence}%)</span>
                    </div>
                  ) : inc.status === 'INVESTIGATING' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDiagnose(inc.id);
                      }}
                      disabled={isDiagnosing}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/50 border border-cyan-500/30 transition-colors disabled:opacity-50"
                    >
                      <Zap className={`w-3 h-3 text-cyan-400 ${isDiagnosing ? 'animate-spin' : ''}`} />
                      <span>{isDiagnosing ? 'Diagnosing...' : 'AI Diagnose'}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
