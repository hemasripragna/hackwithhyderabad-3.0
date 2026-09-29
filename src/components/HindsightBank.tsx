import React, { useState } from 'react';
import { HindsightMemory } from '../types/incident.ts';
import {
  BrainCircuit,
  Search,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Sparkles,
  Zap,
  Terminal,
  ShieldCheck,
  TrendingDown,
  Tag,
  ArrowUpRight
} from 'lucide-react';

interface HindsightBankProps {
  memories: HindsightMemory[];
  selectedMemoryId?: string | null;
  onSelectMemory?: (id: string) => void;
}

export const HindsightBank: React.FC<HindsightBankProps> = ({
  memories,
  selectedMemoryId,
  onSelectMemory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(memories.flatMap(m => m.tags)));

  const filteredMemories = memories.filter(mem => {
    const matchesSearch = 
      mem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mem.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mem.errorSignature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mem.rootCause.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = !activeTag || mem.tags.includes(activeTag);

    return matchesSearch && matchesTag;
  });

  const totalIncidentsPrevented = memories.reduce((acc, m) => acc + m.frequencyCount, 0);
  const avgResolutionTime = (memories.reduce((acc, m) => acc + m.avgMttrMinutes, 0) / (memories.length || 1)).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
      {/* Top Banner: Hindsight Intelligence Metrics */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-md">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Hindsight Organizational Memory Engine</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                  {memories.length} Memories Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Institutional knowledge bank: Remembers what worked, what failed, and prevents repeating costly outages.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Avg MTTR with Memory</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                {avgResolutionTime} mins
              </div>
            </div>

            <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Incidents Recalled</div>
              <div className="text-sm font-bold text-indigo-300">
                {totalIncidentsPrevented} matches
              </div>
            </div>
          </div>
        </div>

        {/* Search & Tags */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search error signatures, services, root causes, solutions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Tag filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                activeTag === null
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Tags
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                  activeTag === tag
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No memories match your query. Solve new incidents to teach Hindsight!
          </div>
        ) : (
          filteredMemories.map(mem => {
            const isSelected = selectedMemoryId === mem.id;
            return (
              <div
                key={mem.id}
                id={mem.id}
                onClick={() => onSelectMemory && onSelectMemory(mem.id)}
                className={`rounded-xl border p-4 sm:p-5 transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/30 shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: ID, Title, Service, Stats */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                      {mem.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-900 text-cyan-300 border border-slate-800">
                      {mem.service}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Clock className="w-3.5 h-3.5" />
                      MTTR: ~{mem.avgMttrMinutes}m
                    </span>
                    <span>Recurred: {mem.frequencyCount}x</span>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-100 mb-1">
                  {mem.title}
                </h3>

                <p className="text-xs font-mono text-slate-400 mb-3 bg-slate-900/60 p-2 rounded border border-slate-800/60 truncate">
                  Signature: {mem.errorSignature}
                </p>

                <div className="text-xs text-slate-300 mb-4 leading-relaxed">
                  <strong className="text-indigo-300">Identified Root Cause:</strong> {mem.rootCause}
                </div>

                {/* What Worked vs What Failed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {/* Successful solutions */}
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Proven Solutions That Worked ({mem.successfulSolutions.length})</span>
                    </div>

                    {mem.successfulSolutions.map((sol, idx) => (
                      <div key={idx} className="text-xs space-y-1">
                        <p className="text-emerald-100 font-medium">{sol.solution}</p>
                        <div className="font-mono text-[11px] text-emerald-400/90 bg-slate-950/80 p-1.5 rounded border border-emerald-900/50 break-all">
                          {sol.actionCommand}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-emerald-400/70 pt-0.5">
                          <span>Verified by: {sol.approvedBy}</span>
                          <span>Effectiveness: {sol.effectivenessScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Failed solutions (Crucial institutional learning!) */}
                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      <span>Solutions That FAILED ❌ (Learned Pitfalls)</span>
                    </div>

                    {mem.failedSolutions.length > 0 ? (
                      mem.failedSolutions.map((fail, idx) => (
                        <div key={idx} className="text-xs space-y-1">
                          <p className="text-rose-100 font-medium">{fail.solution}</p>
                          <div className="font-mono text-[11px] text-rose-300/80 bg-slate-950/80 p-1.5 rounded border border-rose-900/50 break-all">
                            {fail.attemptedCommand}
                          </div>
                          <p className="text-[11px] text-rose-300/80 italic">
                            Why it failed: {fail.whyFailed}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        No failed attempts recorded for this signature.
                      </p>
                    )}
                  </div>
                </div>

                {/* Lessons Learned */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Organizational Rule:</strong> {mem.lessonsLearned}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1 mt-3">
                  {mem.tags.map(t => (
                    <span key={t} className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
