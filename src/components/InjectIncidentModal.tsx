import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Sparkles, 
  Server, 
  AlertTriangle,
  PlusCircle,
  Database,
  Lock,
  CreditCard
} from 'lucide-react';
import { IncidentSeverity } from '../types/incident.ts';

interface InjectIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (data: {
    title: string;
    service: string;
    severity: IncidentSeverity;
    errorSignature: string;
    rawLogs?: string[];
  }) => void;
}

export const InjectIncidentModal: React.FC<InjectIncidentModalProps> = ({
  isOpen,
  onClose,
  onInject
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'mongo' | 'redis' | 'stripe' | 'custom'>('mongo');
  const [customTitle, setCustomTitle] = useState('');
  const [customService, setCustomService] = useState('inventory-api');
  const [customSeverity, setCustomSeverity] = useState<IncidentSeverity>('P1 - Critical');
  const [customError, setCustomError] = useState('KafkaLagSpike: consumer offset lag exceeded 50,000 messages');
  const [customLogs, setCustomLogs] = useState(
    '[2026-09-29T14:45:00.000Z] ERROR [inventory-api.worker]: Kafka consumer group inventory-sync lag 54,200 msg\n[2026-09-29T14:45:01.200Z] WARN  [inventory-api.consumer]: CommitFailedException: rebalance in progress\n[2026-09-29T14:45:02.800Z] FATAL [inventory-api.health]: Processing delay > 120 seconds'
  );

  if (!isOpen) return null;

  const handleSelectPreset = (preset: 'mongo' | 'redis' | 'stripe') => {
    if (preset === 'mongo') {
      onInject({
        title: 'Payment API: MongoNetworkError & 500 Spike on Checkout',
        service: 'payment-api',
        severity: 'P1 - Critical',
        errorSignature: 'MongoNetworkError: connection timed out [pool maxPoolSize=50]',
        rawLogs: [
          '[2026-09-29T15:10:01.002Z] ERROR [payment-api.service]: MongoServerSelectionError: connection timed out after 30000ms',
          '[2026-09-29T15:10:01.005Z] ERROR [payment-api.mongoose]: MongoNetworkError: connection pool exhausted (50/50 active connections)',
          '[2026-09-29T15:10:01.008Z] WARN  [payment-api.router]: POST /v1/charges returned HTTP 500 - wait queue 512 exceeded',
          '[2026-09-29T15:10:02.100Z] FATAL [payment-api.health]: /livez failing: MongoDB ping latency > 25000ms'
        ]
      });
    } else if (preset === 'redis') {
      onInject({
        title: 'Auth Microservice: Redis Cache Eviction Thrash',
        service: 'auth-service',
        severity: 'P2 - High',
        errorSignature: 'OOM command not allowed when used memory > maxmemory (2147483648)',
        rawLogs: [
          '[2026-09-29T15:12:00.100Z] ERROR [auth-service.session]: Redis reply error: OOM command not allowed when used memory > maxmemory',
          '[2026-09-29T15:12:00.200Z] WARN  [auth-service.jwt]: Failed to check token revocation blacklist in Redis; falling back to DB',
          '[2026-09-29T15:12:01.500Z] ERROR [auth-service.cluster]: Eviction policy failed to reclaim memory for key sess:usr_1048'
        ]
      });
    } else if (preset === 'stripe') {
      onInject({
        title: 'Stripe Webhook Worker 429 Rate Limit Storm',
        service: 'checkout-worker',
        severity: 'P2 - High',
        errorSignature: 'StripeRateLimitError: 429 Too Many Requests (idempotency key storm)',
        rawLogs: [
          '[2026-09-29T15:14:00.001Z] ERROR [checkout-worker]: StripeRateLimitError: 429 Too Many Requests',
          '[2026-09-29T15:14:01.100Z] WARN  [checkout-worker]: Retry storm detected. Backlog 8,400 events',
          '[2026-09-29T15:14:02.500Z] FATAL [checkout-worker.queue]: Worker threads blocked on external HTTP 429 lock'
        ]
      });
    }
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInject({
      title: customTitle || `${customService} Service Outage`,
      service: customService,
      severity: customSeverity,
      errorSignature: customError,
      rawLogs: customLogs.split('\n').filter(Boolean)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Simulate Production Outage
              </h3>
              <p className="text-[11px] text-slate-400">
                Inject realistic chaos scenarios to test Hindsight memory recall & safety approval
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Select Preset Chaos Scenario
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Preset 1: Mongo */}
            <button
              onClick={() => handleSelectPreset('mongo')}
              className="p-3 rounded-xl border border-slate-800 hover:border-cyan-500 bg-slate-950/80 hover:bg-slate-900 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
                <Database className="w-4 h-4" />
                <span className="font-bold text-xs">Payment Mongo Pool</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Connection pool exhaustion under 1,200 req/s. The flagship demo.
              </p>
              <span className="mt-2 inline-block px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono text-[10px] border border-rose-800">
                P1 Critical
              </span>
            </button>

            {/* Preset 2: Redis */}
            <button
              onClick={() => handleSelectPreset('redis')}
              className="p-3 rounded-xl border border-slate-800 hover:border-indigo-500 bg-slate-950/80 hover:bg-slate-900 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-indigo-400 mb-1.5">
                <Lock className="w-4 h-4" />
                <span className="font-bold text-xs">Auth Redis OOM</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Keyspace eviction thrash breaches 2GB memory cap.
              </p>
              <span className="mt-2 inline-block px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] border border-amber-800">
                P2 High
              </span>
            </button>

            {/* Preset 3: Stripe */}
            <button
              onClick={() => handleSelectPreset('stripe')}
              className="p-3 rounded-xl border border-slate-800 hover:border-emerald-500 bg-slate-950/80 hover:bg-slate-900 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
                <CreditCard className="w-4 h-4" />
                <span className="font-bold text-xs">Stripe 429 Throttle</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Aggressive idempotency retry storm locks worker queue.
              </p>
              <span className="mt-2 inline-block px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] border border-amber-800">
                P2 High
              </span>
            </button>
          </div>

          {/* Custom Section */}
          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedPreset(selectedPreset === 'custom' ? 'mongo' : 'custom')}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-300 hover:text-slate-100"
            >
              <span>Or Build a Custom Outage Signature</span>
              <span className="text-cyan-400 font-mono text-[11px]">
                {selectedPreset === 'custom' ? 'Hide Form' : 'Show Form'}
              </span>
            </button>

            {selectedPreset === 'custom' && (
              <form onSubmit={handleCustomSubmit} className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Severity</label>
                    <select
                      value={customSeverity}
                      onChange={(e) => setCustomSeverity(e.target.value as IncidentSeverity)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                    >
                      <option value="P1 - Critical">P1 - Critical</option>
                      <option value="P2 - High">P2 - High</option>
                      <option value="P3 - Medium">P3 - Medium</option>
                      <option value="P4 - Low">P4 - Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Incident Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Kafka Consumer Lag Spike & Timeout"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Error Signature</label>
                  <input
                    type="text"
                    value={customError}
                    onChange={(e) => setCustomError(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Raw Error Logs</label>
                  <textarea
                    rows={3}
                    value={customLogs}
                    onChange={(e) => setCustomLogs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30"
                  >
                    Inject Incident
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
