import React, { useState, useEffect } from 'react';
import { Incident, HindsightMemory, IncidentSeverity } from './types/incident.ts';
import { Header } from './components/Header.tsx';
import { IncidentList } from './components/IncidentList.tsx';
import { IncidentDetail } from './components/IncidentDetail.tsx';
import { HindsightBank } from './components/HindsightBank.tsx';
import { ComparisonMode } from './components/ComparisonMode.tsx';
import { InjectIncidentModal } from './components/InjectIncidentModal.tsx';
import { 
  AlertCircle, 
  CheckCircle2, 
  BrainCircuit, 
  ShieldCheck, 
  Activity,
  Layers
} from 'lucide-react';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [memories, setMemories] = useState<HindsightMemory[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incidents' | 'hindsight' | 'comparison'>('incidents');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  
  // Loading & operational states
  const [isLoading, setIsLoading] = useState(true);
  const [isDiagnosingId, setIsDiagnosingId] = useState<string | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'warn' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial incidents and memories
  const loadData = async () => {
    try {
      const [incRes, memRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/hindsight/memories')
      ]);

      const incData = await incRes.json();
      const memData = await memRes.json();

      if (incData.incidents) {
        setIncidents(incData.incidents);
        if (!selectedIncidentId && incData.incidents.length > 0) {
          // Default to the first active incident
          setSelectedIncidentId(incData.incidents[0].id);
        }
      }

      if (memData.memories) {
        setMemories(memData.memories);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      showNotification('Failed to sync with backend server', 'warn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle AI Diagnosis with Hindsight Memory Recall
  const handleDiagnose = async (id: string) => {
    setIsDiagnosingId(id);
    try {
      const res = await fetch(`/api/incidents/${id}/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.incident) {
        setIncidents(prev => prev.map(inc => inc.id === id ? data.incident : inc));
        if (data.memoryRecall?.matched) {
          showNotification(`Hindsight Memory ${data.memoryRecall.memory.id} recalled with ${data.memoryRecall.score}% confidence!`, 'success');
        } else {
          showNotification('Diagnosis completed via first-principles SRE analysis.', 'info');
        }
      }
    } catch (err) {
      console.error('Diagnosis failed:', err);
      showNotification('AI diagnosis encountered an issue. Check console.', 'warn');
    } finally {
      setIsDiagnosingId(null);
    }
  };

  // Handle Engineer Approval of Recommended Action
  const handleApproveAction = async (id: string, approved: boolean, engineerName: string, notes?: string) => {
    setIsExecutingAction(true);
    try {
      const res = await fetch(`/api/incidents/${id}/approve-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, engineerName, notes })
      });
      const data = await res.json();
      if (data.incident) {
        setIncidents(prev => prev.map(inc => inc.id === id ? data.incident : inc));
        if (approved) {
          showNotification(`Action authorized by ${engineerName}. Remediation patch executed successfully!`, 'success');
        } else {
          showNotification('Suggested action rejected. Investigation remains open.', 'info');
        }
      }
    } catch (err) {
      console.error('Failed to execute action:', err);
      showNotification('Action execution error.', 'warn');
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Handle Incident Resolution & Post-Mortem Generation
  const handleResolve = async (id: string, engineerName: string) => {
    setIsResolving(true);
    try {
      const res = await fetch(`/api/incidents/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engineerName })
      });
      const data = await res.json();
      if (data.incident) {
        setIncidents(prev => prev.map(inc => inc.id === id ? data.incident : inc));
        // Refresh memories
        if (data.committedMemory) {
          setMemories(prev => {
            const exists = prev.some(m => m.id === data.committedMemory.id);
            if (exists) {
              return prev.map(m => m.id === data.committedMemory.id ? data.committedMemory : m);
            }
            return [data.committedMemory, ...prev];
          });
        }
        showNotification(`Incident marked RESOLVED! Blameless post-mortem generated and committed to Hindsight memory bank.`, 'success');
      }
    } catch (err) {
      console.error('Failed to resolve incident:', err);
      showNotification('Failed to mark resolved.', 'warn');
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Outage Simulation / Injection
  const handleInjectIncident = async (data: {
    title: string;
    service: string;
    severity: IncidentSeverity;
    errorSignature: string;
    rawLogs?: string[];
  }) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.incident) {
        setIncidents(prev => [result.incident, ...prev]);
        setSelectedIncidentId(result.incident.id);
        setActiveTab('incidents');
        showNotification(`Simulated outage ${result.incident.id} injected into production queue!`, 'warn');
      }
    } catch (err) {
      console.error('Failed to inject incident:', err);
      showNotification('Failed to inject incident.', 'warn');
    }
  };

  // Reset to Hackathon Demo state
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/hindsight/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadData();
        showNotification('Hindsight SRE environment reset to clean hackathon state.', 'success');
      }
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleViewMemoryInBank = (memId: string) => {
    setSelectedMemoryId(memId);
    setActiveTab('hindsight');
  };

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];
  const activeIncidentCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium border backdrop-blur-md ${
            notification.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80 shadow-emerald-950/50'
              : notification.type === 'warn'
              ? 'bg-rose-950/90 text-rose-200 border-rose-700/80 shadow-rose-950/50'
              : 'bg-indigo-950/90 text-indigo-200 border-indigo-700/80 shadow-indigo-950/50'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : notification.type === 'warn' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* SRE Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        memoryCount={memories.length}
        activeIncidentCount={activeIncidentCount}
        onOpenInjectModal={() => setIsInjectModalOpen(true)}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Main Command Center Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <BrainCircuit className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
            <h3 className="font-semibold text-sm text-slate-200">
              Initializing Hindsight SRE Agent Engine...
            </h3>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Synchronizing incident memory graph and real-time telemetry
            </p>
          </div>
        ) : activeTab === 'incidents' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[750px]">
            {/* Left Column: Incidents List (4 cols) */}
            <div className="lg:col-span-4 h-full">
              <IncidentList
                incidents={incidents}
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={(id) => setSelectedIncidentId(id)}
                onDiagnose={handleDiagnose}
                isDiagnosingId={isDiagnosingId}
              />
            </div>

            {/* Right Column: War Room Incident Detail & Human Approval (8 cols) */}
            <div className="lg:col-span-8 h-full">
              {selectedIncident ? (
                <IncidentDetail
                  incident={selectedIncident}
                  onDiagnose={handleDiagnose}
                  isDiagnosing={isDiagnosingId === selectedIncident.id}
                  onApproveAction={handleApproveAction}
                  isExecutingAction={isExecutingAction}
                  onResolve={handleResolve}
                  isResolving={isResolving}
                  onViewMemoryInBank={handleViewMemoryInBank}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 p-8 text-center text-slate-400">
                  Select an incident from the list to begin investigation.
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'hindsight' ? (
          <div className="flex-1 min-h-[750px]">
            <HindsightBank
              memories={memories}
              selectedMemoryId={selectedMemoryId}
              onSelectMemory={(id) => setSelectedMemoryId(id)}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-[750px]">
            <ComparisonMode
              incidents={incidents}
              onSelectIncidentToInvestigate={(id) => {
                setSelectedIncidentId(id);
                setActiveTab('incidents');
              }}
            />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 py-3 px-6 text-center text-[11px] font-mono text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>HackWithHyderabad 3.0</span>
            <span>&bull;</span>
            <span className="text-slate-400">AI Incident Response Agent with Hindsight</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Human Safety Approval: Enforced
            </span>
            <span>&bull;</span>
            <span>Gemini 3.8 Flash Engine</span>
          </div>
        </div>
      </footer>

      {/* Outage Simulation Modal */}
      <InjectIncidentModal
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        onInject={handleInjectIncident}
      />
    </div>
  );
}
