import React, { useState, useEffect } from 'react';
import { Incident, MemoryComparisonResult } from '../types/incident.ts';
import {
  GitCompare,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BrainCircuit,
  Clock,
  ShieldAlert,
  ArrowRight,
  Flame,
  Check,
  TrendingDown,
  Layers
} from 'lucide-react';

interface ComparisonModeProps {
  incidents: Incident[];
  onSelectIncidentToInvestigate: (id: string) => void;
}

export const ComparisonMode: React.FC<ComparisonModeProps> = ({
  incidents,
  onSelectIncidentToInvestigate
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || 'INC-2026-881');
  const [comparison, setComparison] = useState<MemoryComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStoryStep, setActiveStoryStep] = useState<1 | 2>(2);

  const fetchComparison = async (incId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hindsight/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId: incId })
      });
      const data = await res.json();
      if (data.comparison) {
        setComparison(data.comparison);
      }
    } catch (err) {
      console.error('Failed to load comparison:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedIncidentId) {
      fetchComparison(selectedIncidentId);
    }
  }, [selectedIncidentId]);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 overflow-y-auto">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>The Hackathon Star Demo: Memory Benchmark</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  Hindsight vs Generic LLM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Witness why standard AI chatbots fail at SRE operations, while Hindsight organizational memory eliminates repeated outages.
              </p>
            </div>
          </div>

          {/* Incident Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Test Incident:</span>
            <select
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              {incidents.map(inc => (
                <option key={inc.id} value={inc.id}>
                  {inc.id} - {inc.service} ({inc.severity})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2-Step Interactive Story Arc (Incident 1 vs Incident 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div 
            onClick={() => setActiveStoryStep(1)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeStoryStep === 1
                ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold font-mono text-cyan-400 uppercase">
                Phase 1: First Occurrence
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                Knowledge Acquisition
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-100">
              Incident 1: AI Investigates &rarr; Engineer Approves &rarr; Solved &rarr; Hindsight Learns
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              No precedent exists. Pod restart fails; connection pool scaling succeeds. The outcome is committed to Hindsight memory bank.
            </p>
          </div>

          <div 
            onClick={() => setActiveStoryStep(2)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeStoryStep === 2
                ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/30'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold font-mono text-indigo-400 uppercase">
                Phase 2: Recurring Outage
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                Instant Recall
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-100">
              Incident 2: Similar Error &rarr; Recalls Incident 1 &rarr; Flags Pitfall &rarr; 4 Min MTTR
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Similar error strikes. Agent recalls past failure (don't reboot!) and recommends proven pool expansion in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Container */}
      <div className="p-4 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <BrainCircuit className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono">Running side-by-side memory inference...</p>
          </div>
        ) : comparison ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: WITHOUT MEMORY (GENERIC AI CHATBOT) */}
            <div className="rounded-xl border border-rose-500/40 bg-slate-950/80 p-5 space-y-4 shadow-lg shadow-rose-950/20 relative">
              <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 font-bold">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-rose-200">
                      WITHOUT MEMORY
                    </h3>
                    <p className="text-[11px] text-rose-400/80 font-mono">
                      Generic LLM / Stateless Chatbot
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-500">Est. MTTR</div>
                  <div className="text-sm font-bold font-mono text-rose-400">
                    ~52 minutes
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="space-y-1">
                <div className="text-[11px] font-mono font-bold uppercase text-slate-400">AI Diagnosis</div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {comparison.withoutMemory.diagnosis}
                </div>
              </div>

              {/* Suggested Actions */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono font-bold uppercase text-slate-400">Generic Advice</div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
                  {comparison.withoutMemory.suggestedActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-mono">•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Fatal Flaw */}
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-300">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Hidden Operational Trap</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {comparison.withoutMemory.riskOfMistake}
                </p>
              </div>

              {/* SRE Verdict */}
              <div className="text-[11px] text-slate-500 italic bg-slate-900/40 p-2.5 rounded border border-slate-800/60">
                <strong>Why it fails:</strong> {comparison.withoutMemory.notes}
              </div>
            </div>

            {/* RIGHT COLUMN: WITH HINDSIGHT ORGANIZATIONAL MEMORY */}
            <div className="rounded-xl border-2 border-emerald-500/50 bg-gradient-to-br from-indigo-950/20 via-slate-950 to-slate-950 p-5 space-y-4 shadow-xl shadow-emerald-950/20 relative">
              <div className="flex items-center justify-between border-b border-emerald-800/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-200 flex items-center gap-2">
                      <span>WITH HINDSIGHT</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {comparison.withHindsight.confidence}% Match
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-mono">
                      Institutional Experience Recalled ({comparison.withHindsight.recalledMemoryId})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-500">Est. MTTR</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    {comparison.withHindsight.estimatedTimeToResolution}
                  </div>
                </div>
              </div>

              {/* Diagnosis with Historical Precedent */}
              <div className="space-y-1">
                <div className="text-[11px] font-mono font-bold uppercase text-slate-400">Hindsight Grounded Diagnosis</div>
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-medium">
                  {comparison.withHindsight.diagnosis}
                </div>
              </div>

              {/* Proven Solution */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono font-bold uppercase text-emerald-400">Proven Remediation Action</div>
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 text-xs text-slate-200">
                  {comparison.withHindsight.suggestedActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="font-medium">{action}</span>
                    </div>
                  ))}
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-emerald-400 border border-emerald-950 break-all">
                    {comparison.withHindsight.provenRemediationScript}
                  </div>
                </div>
              </div>

              {/* Preempted Pitfalls (Learned from previous failures) */}
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  <span>Learned Pitfall Preemption</span>
                </div>
                {comparison.withHindsight.preemptedPitfalls.map((pitfall, idx) => (
                  <p key={idx} className="text-[11px] leading-relaxed text-indigo-200">
                    &bull; {pitfall}
                  </p>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onSelectIncidentToInvestigate(selectedIncidentId)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
                >
                  <span>Investigate this incident in Incident Command</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* The Core Formula Banner */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 text-center">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">
            The Autonomous SRE Memory Cycle
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-mono text-xs sm:text-sm font-semibold">
            <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800">1. Incident</span>
            <span className="text-slate-600">&rarr;</span>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">2. Analyze</span>
            <span className="text-slate-600">&rarr;</span>
            <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">3. Recall Hindsight</span>
            <span className="text-slate-600">&rarr;</span>
            <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">4. Human Approval</span>
            <span className="text-slate-600">&rarr;</span>
            <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">5. Learn & Persist</span>
          </div>
        </div>
      </div>
    </div>
  );
};
