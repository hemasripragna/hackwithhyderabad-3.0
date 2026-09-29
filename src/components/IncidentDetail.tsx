import React, { useState } from 'react';
import { Incident } from '../types/incident.ts';
import {
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  BrainCircuit,
  Zap,
  CheckCircle2,
  XCircle,
  Copy,
  Terminal,
  Activity,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Flame,
  ArrowRight,
  UserCheck,
  RotateCcw
} from 'lucide-react';

interface IncidentDetailProps {
  incident: Incident;
  onDiagnose: (id: string) => void;
  isDiagnosing: boolean;
  onApproveAction: (id: string, approved: boolean, engineerName: string, notes?: string) => void;
  isExecutingAction: boolean;
  onResolve: (id: string, engineerName: string) => void;
  isResolving: boolean;
  onViewMemoryInBank: (memoryId: string) => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  incident,
  onDiagnose,
  isDiagnosing,
  onApproveAction,
  isExecutingAction,
  onResolve,
  isResolving,
  onViewMemoryInBank
}) => {
  const [engineerName, setEngineerName] = useState('Alex Rivera (Senior SRE)');
  const [approvalNotes, setApprovalNotes] = useState('Reviewed past incident precedent in Hindsight. Action verified safe to apply.');
  const [showLogs, setShowLogs] = useState(true);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [logFilter, setLogFilter] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const filteredLogs = incident.rawLogs.filter(line => 
    line.toLowerCase().includes(logFilter.toLowerCase())
  );

  const isResolved = incident.status === 'RESOLVED';
  const isAwaitingApproval = incident.status === 'AWAITING_APPROVAL';
  const isExecuting = incident.status === 'ACTION_EXECUTING';
  const hasDiagnosis = !!incident.diagnosis;
  const hasRecalledMemory = !!incident.diagnosis?.recalledMemoryId;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 overflow-y-auto">
      {/* Top Banner / War Room Header */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
              {incident.id}
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${
              incident.severity.includes('P1') 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {incident.severity}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              {incident.service}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-400">
              {incident.environment}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Started: {new Date(incident.startedAt).toLocaleTimeString()}</span>
            </div>

            {/* Quick Action in Header */}
            {!hasDiagnosis && incident.status === 'INVESTIGATING' && (
              <button
                onClick={() => onDiagnose(incident.id)}
                disabled={isDiagnosing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                <span>{isDiagnosing ? 'Diagnosing with Hindsight...' : 'Run AI Diagnosis'}</span>
              </button>
            )}

            {isExecuting && (
              <button
                onClick={() => onResolve(incident.id, engineerName)}
                disabled={isResolving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isResolving ? 'Finalizing Post-Mortem...' : 'Resolve & Generate Post-Mortem'}</span>
              </button>
            )}
          </div>
        </div>

        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          {incident.title}
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1 truncate">
          Signature: {incident.errorSignature}
        </p>

        {/* Live Metrics Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Error Rate</div>
            <div className={`text-base font-bold font-mono ${
              parseFloat(incident.metrics.errorRate) > 10 ? 'text-rose-400 flex items-center gap-1' : 'text-emerald-400'
            }`}>
              {parseFloat(incident.metrics.errorRate) > 10 && <Flame className="w-4 h-4 text-rose-500 animate-bounce" />}
              {incident.metrics.errorRate}
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">p99 Latency</div>
            <div className="text-base font-bold font-mono text-slate-100">
              {incident.metrics.p99Latency}
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Active Connections</div>
            <div className="text-base font-bold font-mono text-slate-100">
              {incident.metrics.activeConnections} / 50
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">CPU Load</div>
            <div className="text-base font-bold font-mono text-slate-100">
              {incident.metrics.cpuUsage}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Step 1: Investigation & Hindsight Memory Recall Banner */}
        {!hasDiagnosis ? (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center mx-auto text-cyan-400 shadow-md">
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Awaiting Agent Investigation
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                The agent will parse error logs, analyze stack traces, and query Hindsight organizational memory for matching past incidents.
              </p>
            </div>
            <button
              onClick={() => onDiagnose(incident.id)}
              disabled={isDiagnosing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
              <span>{isDiagnosing ? 'Agent Analyzing Memory Bank...' : 'Start AI Diagnosis & Memory Recall'}</span>
            </button>
          </div>
        ) : (
          <>
            {/* HINDSIGHT RECALL HIGHLIGHT CARD */}
            {hasRecalledMemory ? (
              <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-lg shadow-indigo-950/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-indigo-200">
                      Hindsight Memory Match Recalled
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {incident.diagnosis?.recalledMemoryId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                      {incident.diagnosis?.recalledSimilarityScore || incident.diagnosis?.confidence}% Pattern Match
                    </span>
                    <button
                      onClick={() => onViewMemoryInBank(incident.diagnosis!.recalledMemoryId!)}
                      className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>View in Bank</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/80 rounded-lg p-3 border border-indigo-900/40 mb-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-indigo-300">Historical Precedent:</strong> {incident.diagnosis?.reasoning}
                  </p>
                </div>

                {/* What worked vs what failed in the past */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {/* What Worked in the past */}
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Past Solution that WORKED ✅</span>
                    </div>
                    <p className="text-xs text-emerald-100/90 font-medium">
                      {incident.diagnosis?.recommendedAction.title}
                    </p>
                    <p className="text-[11px] text-emerald-400/80 font-mono mt-1">
                      Recovery time: ~{incident.diagnosis?.recommendedAction.estimatedRecoveryTime}
                    </p>
                  </div>

                  {/* What FAILED in the past (Pitfall warning) */}
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 mb-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                      <span>Past Attempt that FAILED ❌ (DO NOT REPEAT)</span>
                    </div>
                    {incident.diagnosis?.failedPastAttempts && incident.diagnosis.failedPastAttempts.length > 0 ? (
                      incident.diagnosis.failedPastAttempts.map((f, idx) => (
                        <div key={idx} className="text-xs text-rose-200/90">
                          <p className="font-semibold">{f.attemptedSolution}</p>
                          <p className="text-[11px] text-rose-300/70 mt-0.5">{f.whyFailed}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-rose-300/70">
                        Container pod restart was marked dangerous under active queue loads.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* First Principles Diagnosis (No prior memory) */
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>First-Principles Diagnosis (No Historical Precedent)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {incident.diagnosis?.reasoning}
                </p>
              </div>
            )}

            {/* AI DIAGNOSIS & ROOT CAUSE */}
            <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Root Cause Diagnosis
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Confidence: <strong className="text-slate-200">{incident.diagnosis?.confidence}%</strong>
                </span>
              </div>
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                {incident.diagnosis?.rootCause}
              </p>
            </div>

            {/* RECOMMENDED ACTION CARD */}
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Recommended Remediation Action
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    incident.diagnosis?.recommendedAction.riskLevel === 'LOW'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                  }`}>
                    Risk: {incident.diagnosis?.recommendedAction.riskLevel}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Est. Recovery: {incident.diagnosis?.recommendedAction.estimatedRecoveryTime}
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-cyan-300 mb-1">
                {incident.diagnosis?.recommendedAction.title}
              </h4>
              <p className="text-xs text-slate-300 mb-3">
                {incident.diagnosis?.recommendedAction.description}
              </p>

              {/* Command / Diff Block */}
              <div className="relative rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-xs text-slate-200 overflow-x-auto group">
                <button
                  onClick={() => copyToClipboard(incident.diagnosis!.recommendedAction.commandOrDiff)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 opacity-70 group-hover:opacity-100 transition-opacity"
                  title="Copy command"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">EXECUTION COMMAND</div>
                <pre className="text-emerald-400 whitespace-pre-wrap break-all pr-8">
                  {incident.diagnosis?.recommendedAction.commandOrDiff}
                </pre>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 italic">
                <strong>Why this action:</strong> {incident.diagnosis?.recommendedAction.whyThisAction}
              </div>
            </div>

            {/* HUMAN-IN-THE-LOOP APPROVAL WORKBENCH (REAL-WORLD SAFETY) */}
            {!isResolved && (
              <div className="rounded-xl border-2 border-cyan-500/40 bg-slate-950 p-4 sm:p-5 shadow-xl relative">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                    Human-in-the-Loop Safety Approval
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                    Autonomous Execution Blocked
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Real-World Safety Guard: The AI Agent recommends solutions but will <strong className="text-white">NEVER execute production commands without explicit engineer sign-off</strong>.
                </p>

                {incident.approval?.status === 'APPROVED' ? (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-200">
                        Approved by {incident.approval.approvedBy} at {new Date(incident.approval.approvedAt || '').toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400">STATUS: EXECUTING</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Authorizing Engineer / On-Call SRE
                        </label>
                        <input
                          type="text"
                          value={engineerName}
                          onChange={(e) => setEngineerName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                          placeholder="Engineer name..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Approval Notes / Justification
                        </label>
                        <input
                          type="text"
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                          placeholder="Verification notes..."
                        />
                      </div>
                    </div>

                    {/* Pre-flight verification checklist */}
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Command diff checked against destructive patterns (No blind container kill)</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Historical safety precedent verified in Hindsight memory</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => onApproveAction(incident.id, false, engineerName, 'Rejected by engineer for alternate investigation.')}
                        disabled={isExecutingAction}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      >
                        Reject & Modify
                      </button>

                      <button
                        onClick={() => onApproveAction(incident.id, true, engineerName, approvalNotes)}
                        disabled={isExecutingAction}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isExecutingAction ? 'Executing Approved Action...' : 'Approve & Execute Action'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LIVE EXECUTION AUDIT TRAIL */}
            {incident.executionLogs && incident.executionLogs.length > 0 && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-200">
                      Remediation Execution Terminal Audit
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    ALL CHECKS PASSED
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {incident.executionLogs.map((log, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800/80 flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                          <span className="font-semibold text-slate-200">{log.step}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-300 break-all">{log.output}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {!isResolved && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => onResolve(incident.id, engineerName)}
                      disabled={isResolving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isResolving ? 'Committing to Hindsight...' : 'Mark Incident Resolved & Generate Post-Mortem'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* RESOLVED POST-MORTEM & HINDSIGHT LEARNING BANNER */}
            {isResolved && incident.postMortem && (
              <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-slate-900/90 to-slate-950 p-4 sm:p-6 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/40 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-emerald-200">
                        Blameless Post-Mortem Generated
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Resolved in {incident.postMortem.durationMinutes} minutes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Committed to Hindsight ({incident.postMortem.hindsightMemoryId || 'HIND-M-NEW'})</span>
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Incident Summary</h4>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    {incident.postMortem.summary}
                  </p>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Resolution Timeline</h4>
                  <div className="space-y-1.5 font-mono text-xs">
                    {incident.postMortem.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-1.5 rounded bg-slate-950/40 border border-slate-900 text-slate-300">
                        <span className="text-cyan-400 font-semibold w-12">{item.time}</span>
                        <span className="text-slate-400">•</span>
                        <span>{item.event}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preventative actions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Action Items & Organizational Learnings</h4>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {incident.postMortem.preventativeActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {/* RAW LOGS & STACK TRACE VIEWER */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <div 
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center justify-between p-3 bg-slate-900/80 cursor-pointer hover:bg-slate-900 transition-colors border-b border-slate-800"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-mono uppercase tracking-wide font-semibold text-slate-300">
                Application Logs & Stack Trace
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {incident.rawLogs.length} lines
              </span>
            </div>

            <div className="flex items-center gap-2">
              {showLogs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {showLogs && (
            <div className="p-3">
              <div className="mb-2">
                <input
                  type="text"
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  placeholder="Filter logs (e.g. ERROR, connection, timeout)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="bg-slate-900/90 rounded-lg p-3 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto space-y-1">
                {filteredLogs.map((line, idx) => {
                  const isError = line.includes('ERROR') || line.includes('FATAL');
                  const isWarn = line.includes('WARN');
                  return (
                    <div 
                      key={idx}
                      className={`leading-relaxed break-all ${
                        isError ? 'text-rose-400' : isWarn ? 'text-amber-300' : 'text-slate-400'
                      }`}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
