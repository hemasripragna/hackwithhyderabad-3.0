import { Incident, HindsightMemory, MemoryComparisonResult } from '../src/types/incident.ts';

// Initial Hindsight Organizational Knowledge Base
export const initialHindsightMemories: HindsightMemory[] = [
  {
    id: 'HIND-M-402',
    title: 'Payment Gateway MongoDB Connection Pool Exhaustion under Flash Sale load',
    service: 'payment-api',
    errorSignature: 'MongoNetworkError: connection timed out [pool maxPoolSize=50]',
    rootCause: 'Default Mongoose client maxPoolSize of 50 was saturated when payment requests surged above 1,200 req/sec during flash checkout spikes.',
    successfulSolutions: [
      {
        solution: 'Dynamic Mongo connection pool expansion to 250 connections with non-disruptive hot configuration reload.',
        actionCommand: 'kubectl set env deployment/payment-api MONGO_MAX_POOL_SIZE=250 MONGO_MIN_POOL_SIZE=50 && kubectl rollout restart deployment/payment-api --strategy=RollingUpdate',
        approvedBy: 'senior-sre-alex',
        ttfrMinutes: 4.2,
        effectivenessScore: 98,
        dateResolved: '2026-08-14T11:42:00Z',
        outcomeSummary: 'Connection queue dropped to 0 within 90 seconds. Payment API 500 error rate dropped from 48% to 0.01% with zero downtime.'
      }
    ],
    failedSolutions: [
      {
        solution: 'Immediate container pod restart (kill -9 payment-api pods)',
        attemptedCommand: 'kubectl rollout restart deployment/payment-api',
        whyFailed: 'Restarting all pods without adjusting pool size triggered a thundering herd cold-start storm against MongoDB, causing cascading timeouts and cascading failures for 18 minutes.',
        dateAttempted: '2026-07-02T19:15:00Z'
      }
    ],
    frequencyCount: 3,
    avgMttrMinutes: 4.8,
    tags: ['mongodb', 'connection-pool', 'payment-api', 'mongoose', 'kubernetes'],
    lessonsLearned: 'Never blindly restart payment pods during peak load. Always scale maxPoolSize first, or enable MongoDB connection multiplexing.',
    createdAt: '2026-07-02T19:40:00Z',
    updatedAt: '2026-08-14T12:00:00Z'
  },
  {
    id: 'HIND-M-219',
    title: 'Redis Session Cache OOM & Keyspace Eviction Storm',
    service: 'auth-service',
    errorSignature: 'OOM command not allowed when used memory > maxmemory (2147483648)',
    rootCause: 'User session JWT revocation blacklist was stored with no TTL expiry, causing Redis heap to breach the 2GB cap and enter volatile-lru eviction thrash.',
    successfulSolutions: [
      {
        solution: 'Patch memory limit to 4GB and dynamically configure allKeys-lru eviction with fallback TTL enforce script.',
        actionCommand: 'redis-cli -h auth-redis.internal CONFIG SET maxmemory 4294967296 && redis-cli -h auth-redis.internal CONFIG SET maxmemory-policy allkeys-lru',
        approvedBy: 'lead-devops-priya',
        ttfrMinutes: 5.5,
        effectivenessScore: 95,
        dateResolved: '2026-08-28T09:12:00Z',
        outcomeSummary: 'Eviction storm halted immediately. User login latency normalized from 4,800ms back to 42ms.'
      }
    ],
    failedSolutions: [
      {
        solution: 'Execute FLUSHALL or FLUSHDB on live Redis cluster',
        attemptedCommand: 'redis-cli FLUSHDB',
        whyFailed: 'Wiped all active login sessions, causing 85,000 active users to be logged out simultaneously and triggering an unbearable auth storm.',
        dateAttempted: '2026-05-11T14:20:00Z'
      }
    ],
    frequencyCount: 2,
    avgMttrMinutes: 6.2,
    tags: ['redis', 'auth-service', 'oom', 'cache', 'jwt'],
    lessonsLearned: 'Never flush auth session cache during production hours. Increase memory ceiling and adjust eviction policy dynamically first.',
    createdAt: '2026-05-11T15:00:00Z',
    updatedAt: '2026-08-28T10:00:00Z'
  },
  {
    id: 'HIND-M-508',
    title: 'Stripe Webhook Worker Retry Cascade & 429 Rate Limiting',
    service: 'checkout-worker',
    errorSignature: 'StripeRateLimitError: 429 Too Many Requests (idempotency key storm)',
    rootCause: 'Worker failed to implement exponential jittered backoff on Stripe API retries, causing self-inflicted 429 rate limiting loop.',
    successfulSolutions: [
      {
        solution: 'Enable jittered exponential backoff and throttle worker concurrency to 15 concurrent consumers.',
        actionCommand: 'kubectl set env deployment/checkout-worker RETRY_BACKOFF_BASE=2 RETRY_JITTER=true MAX_CONCURRENCY=15',
        approvedBy: 'sre-marcus',
        ttfrMinutes: 3.8,
        effectivenessScore: 100,
        dateResolved: '2026-09-02T16:20:00Z',
        outcomeSummary: '429 errors ceased within 45 seconds. Webhook processing backlog of 12,400 messages cleared in 7 minutes.'
      }
    ],
    failedSolutions: [
      {
        solution: 'Scaling checkout-worker replicas from 5 to 20',
        attemptedCommand: 'kubectl scale deployment/checkout-worker --replicas=20',
        whyFailed: 'Quadrupled the concurrent outgoing requests to Stripe API, locking the organization into a hard 1-hour rate limit penalty.',
        dateAttempted: '2026-06-19T08:30:00Z'
      }
    ],
    frequencyCount: 4,
    avgMttrMinutes: 4.1,
    tags: ['stripe', 'rate-limit', 'checkout-worker', 'backoff', 'webhooks'],
    lessonsLearned: 'Never scale workers horizontally when facing downstream 429 errors. Throttle and back off first.',
    createdAt: '2026-06-19T09:10:00Z',
    updatedAt: '2026-09-02T16:45:00Z'
  }
];

// Active & Initial Incidents
export const initialIncidents: Incident[] = [
  {
    id: 'INC-2026-881',
    title: 'Payment API: MongoNetworkError & 500 Spike on Checkout',
    service: 'payment-api',
    environment: 'production',
    severity: 'P1 - Critical',
    status: 'INVESTIGATING',
    startedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    errorSignature: 'MongoNetworkError: connection timed out [pool maxPoolSize=50]',
    metrics: {
      errorRate: '42.8%',
      p99Latency: '4,150ms',
      activeConnections: 50,
      cpuUsage: '78%'
    },
    rawLogs: [
      '[2026-09-29T14:32:01.102Z] ERROR [payment-api.service]: MongoServerSelectionError: connection timed out after 30000ms',
      '[2026-09-29T14:32:01.105Z] ERROR [payment-api.mongoose]: MongoNetworkError: connection pool exhausted (50/50 active connections)',
      '[2026-09-29T14:32:01.108Z] WARN  [payment-api.router]: POST /v1/charges returned HTTP 500 - mongo pool wait queue length 481 exceeded',
      '[2026-09-29T14:32:02.412Z] ERROR [payment-api.core]: Failed to persist order transaction 88f29c: MongoNetworkTimeoutException',
      '    at ConnectionPool.checkout (/app/node_modules/mongodb/lib/cmap/connection_pool.js:284:18)',
      '    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
      '    at async ChargeService.processPayment (/app/dist/services/charge.js:142:9)',
      '[2026-09-29T14:32:05.890Z] FATAL [payment-api.health]: Healthcheck /livez failing: MongoDB ping latency > 25000ms'
    ]
  },
  {
    id: 'INC-2026-882',
    title: 'Auth Microservice: Redis Cache Eviction Thrash',
    service: 'auth-service',
    environment: 'production',
    severity: 'P2 - High',
    status: 'INVESTIGATING',
    startedAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    errorSignature: 'OOM command not allowed when used memory > maxmemory (2147483648)',
    metrics: {
      errorRate: '19.4%',
      p99Latency: '2,900ms',
      activeConnections: 120,
      cpuUsage: '94%'
    },
    rawLogs: [
      '[2026-09-29T14:02:11.892Z] ERROR [auth-service.session]: Redis reply error: OOM command not allowed when used memory > maxmemory (2147483648 bytes)',
      '[2026-09-29T14:02:11.895Z] WARN  [auth-service.jwt]: Failed to check token revocation blacklist in Redis; falling back to DB query (slow path)',
      '[2026-09-29T14:02:12.110Z] ERROR [auth-service.cluster]: Eviction policy failed to reclaim sufficient memory for key sess:usr_9921',
      '[2026-09-29T14:02:14.301Z] WARN  [auth-service.gateway]: Latency budget exceeded on /v2/auth/verify (p99 = 2,900ms)'
    ]
  },
  {
    id: 'INC-2026-879',
    title: 'Stripe Webhook Processor 429 Throttle Lockdown',
    service: 'checkout-worker',
    environment: 'production',
    severity: 'P2 - High',
    status: 'RESOLVED',
    startedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 165 * 60 * 1000).toISOString(),
    errorSignature: 'StripeRateLimitError: 429 Too Many Requests (idempotency key storm)',
    metrics: {
      errorRate: '0.0%',
      p99Latency: '110ms',
      activeConnections: 15,
      cpuUsage: '32%'
    },
    rawLogs: [
      '[2026-09-29T11:45:10.001Z] ERROR [checkout-worker]: StripeRateLimitError: 429 Too Many Requests',
      '[2026-09-29T11:51:30.200Z] INFO  [hindsight-agent]: Recalled HIND-M-508 with 99% similarity score.',
      '[2026-09-29T11:53:15.000Z] INFO  [engineer-approval]: Action approved by SRE marcus: deploy jittered backoff & throttle concurrency to 15.',
      '[2026-09-29T11:55:00.000Z] SUCCESS [execution-engine]: Applied Kubernetes deployment update. 429 errors ceased.'
    ],
    diagnosis: {
      rootCause: 'Aggressive retry storm without exponential backoff triggered Stripe API 429 rate limit.',
      confidence: 99,
      reasoning: 'Hindsight match HIND-M-508 confirmed identical error signature and idempotency key collision pattern.',
      recalledMemoryId: 'HIND-M-508',
      recalledMemoryTitle: 'Stripe Webhook Worker Retry Cascade & 429 Rate Limiting',
      recalledSimilarityScore: 99,
      recommendedAction: {
        id: 'ACT-508-R',
        title: 'Apply Jittered Backoff & Concurrency Cap',
        description: 'Update deployment environment to enable exponential backoff and cap concurrent consumers to 15.',
        commandOrDiff: 'kubectl set env deployment/checkout-worker RETRY_BACKOFF_BASE=2 RETRY_JITTER=true MAX_CONCURRENCY=15',
        riskLevel: 'LOW',
        estimatedRecoveryTime: '2-4 minutes',
        whyThisAction: 'Prevents Stripe API lockouts while allowing queue backlog to drain smoothly without thundering herd.'
      },
      failedPastAttempts: [
        {
          attemptedSolution: 'Scaling checkout-worker replicas from 5 to 20',
          whyFailed: 'Quadrupled the concurrent outgoing requests to Stripe API, locking the organization into a hard 1-hour rate limit penalty.',
          historicalIncidentId: 'INC-2026-619'
        }
      ],
      source: 'HINDSIGHT_MEMORY'
    },
    approval: {
      status: 'APPROVED',
      approvedBy: 'sre-marcus',
      approvedAt: new Date(Date.now() - 170 * 60 * 1000).toISOString(),
      notes: 'Applied proven Hindsight recommendation. Worked perfectly.'
    },
    postMortem: {
      incidentId: 'INC-2026-879',
      title: 'Stripe Webhook Processor 429 Throttle Lockdown',
      durationMinutes: 15,
      summary: 'High checkout traffic triggered Stripe rate-limits due to unjittered retry loops. Solved in 4 minutes using Hindsight recalled config.',
      timeline: [
        { time: '11:45', event: 'Alert fired: Stripe 429 rate-limiting detected on checkout-worker', type: 'alert' },
        { time: '11:46', event: 'Hindsight agent matched past incident HIND-M-508 with 99% confidence', type: 'agent' },
        { time: '11:48', event: 'SRE Marcus reviewed past failure (scaling pods) and approved backoff patch', type: 'human' },
        { time: '11:50', event: 'Command executed successfully; error rate dropped to 0%', type: 'action' },
        { time: '12:00', event: 'Queue drained, incident marked resolved, memory updated', type: 'recovery' }
      ],
      rootCause: 'Unbounded retries against 3rd party Stripe API without backoff.',
      remediationTaken: 'Injected RETRY_BACKOFF_BASE=2 and clamped worker concurrency to 15.',
      preventativeActions: [
        'Enforce circuit breakers across all 3rd party payment integrations',
        'Add Prometheus alert for webhook queue processing velocity'
      ],
      hindsightLearningCommitted: true,
      hindsightMemoryId: 'HIND-M-508'
    }
  }
];

// In-Memory store for the active session
let currentMemories: HindsightMemory[] = JSON.parse(JSON.stringify(initialHindsightMemories));
let currentIncidents: Incident[] = JSON.parse(JSON.stringify(initialIncidents));

export function getMemories(): HindsightMemory[] {
  return currentMemories;
}

export function getIncidents(): Incident[] {
  return currentIncidents;
}

export function getIncidentById(id: string): Incident | undefined {
  return currentIncidents.find(inc => inc.id === id);
}

export function addIncident(newIncident: Incident): Incident {
  currentIncidents.unshift(newIncident);
  return newIncident;
}

export function updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
  const index = currentIncidents.findIndex(inc => inc.id === id);
  if (index === -1) return undefined;
  currentIncidents[index] = { ...currentIncidents[index], ...updates };
  return currentIncidents[index];
}

// Search Hindsight memory for similar past incidents
export function searchHindsight(service: string, errorSignature: string, logs: string[]): {
  match: HindsightMemory | null;
  similarityScore: number;
  allMatches: Array<{ memory: HindsightMemory; score: number }>;
} {
  const queryStr = `${service} ${errorSignature} ${logs.join(' ')}`.toLowerCase();
  
  const scored = currentMemories.map(mem => {
    let score = 0;
    
    // Service match
    if (mem.service.toLowerCase() === service.toLowerCase()) {
      score += 40;
    }
    
    // Exact error signature match
    const sigWords = mem.errorSignature.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    let matchedSigWords = 0;
    for (const word of sigWords) {
      if (queryStr.includes(word)) {
        matchedSigWords++;
      }
    }
    if (sigWords.length > 0) {
      score += Math.min(45, (matchedSigWords / sigWords.length) * 45);
    }
    
    // Tag match
    for (const tag of mem.tags) {
      if (queryStr.includes(tag.toLowerCase())) {
        score += 5;
      }
    }

    // Clamp score
    score = Math.min(99, Math.round(score));
    return { memory: mem, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const topMatch = scored.length > 0 && scored[0].score >= 60 ? scored[0] : null;

  return {
    match: topMatch ? topMatch.memory : null,
    similarityScore: topMatch ? topMatch.score : 0,
    allMatches: scored
  };
}

// Commit new resolution outcome to Hindsight memory
export function commitOutcomeToHindsight(
  incident: Incident,
  solutionTitle: string,
  commandUsed: string,
  engineerName: string,
  wasSuccessful: boolean,
  failureReason?: string
): HindsightMemory {
  // Check if memory already exists
  const existing = currentMemories.find(m => 
    m.service === incident.service && 
    (m.errorSignature.toLowerCase().includes(incident.errorSignature.toLowerCase().slice(0, 20)) || 
     incident.errorSignature.toLowerCase().includes(m.errorSignature.toLowerCase().slice(0, 20)))
  );

  const now = new Date().toISOString();

  if (existing) {
    if (wasSuccessful) {
      existing.successfulSolutions.unshift({
        solution: solutionTitle,
        actionCommand: commandUsed,
        approvedBy: engineerName,
        ttfrMinutes: 4.0,
        effectivenessScore: 98,
        dateResolved: now,
        outcomeSummary: `Resolved incident ${incident.id} with immediate stabilization.`
      });
      existing.frequencyCount += 1;
      existing.updatedAt = now;
    } else {
      existing.failedSolutions.unshift({
        solution: solutionTitle,
        attemptedCommand: commandUsed,
        whyFailed: failureReason || 'Failed to remediate root cause; metric error rate stayed high.',
        dateAttempted: now
      });
      existing.updatedAt = now;
    }
    return existing;
  } else {
    // Create new Hindsight memory entry
    const newMemory: HindsightMemory = {
      id: `HIND-M-${Math.floor(100 + Math.random() * 900)}`,
      title: `${incident.service.toUpperCase()}: ${incident.title}`,
      service: incident.service,
      errorSignature: incident.errorSignature,
      rootCause: incident.diagnosis?.rootCause || 'Root cause analyzed during incident remediation.',
      successfulSolutions: wasSuccessful ? [{
        solution: solutionTitle,
        actionCommand: commandUsed,
        approvedBy: engineerName,
        ttfrMinutes: 5.0,
        effectivenessScore: 95,
        dateResolved: now,
        outcomeSummary: `Remediated ${incident.id} and established new precedent.`
      }] : [],
      failedSolutions: wasSuccessful ? [] : [{
        solution: solutionTitle,
        attemptedCommand: commandUsed,
        whyFailed: failureReason || 'Failed to solve issue during initial trial.',
        dateAttempted: now
      }],
      frequencyCount: 1,
      avgMttrMinutes: 5.0,
      tags: [incident.service, 'production-incident', ...incident.errorSignature.toLowerCase().split(/[\s:,\-_]+/).filter(w => w.length > 4).slice(0, 4)],
      lessonsLearned: `Documented during post-mortem for ${incident.id}. Always verify logs before executing high-impact commands.`,
      createdAt: now,
      updatedAt: now
    };

    currentMemories.unshift(newMemory);
    return newMemory;
  }
}

// Compare With Hindsight vs Without Memory
export function generateMemoryComparison(incident: Incident): MemoryComparisonResult {
  const { match, similarityScore } = searchHindsight(incident.service, incident.errorSignature, incident.rawLogs);

  if (match) {
    const bestSolution = match.successfulSolutions[0];
    const failedAttempts = match.failedSolutions.map(f => `${f.solution} - Resulted in: ${f.whyFailed}`);

    return {
      incidentTitle: incident.title,
      errorSignature: incident.errorSignature,
      withoutMemory: {
        diagnosis: "Generic diagnosis: The application cannot connect to downstream database or service. Could be network partition, wrong credentials, or server crash.",
        suggestedActions: [
          "1. Restart the payment-api application pods/containers (standard troubleshooting step).",
          "2. Check if MongoDB server is powered on and accessible on port 27017.",
          "3. Inspect network firewalls and VPC peering routes.",
          "4. Verify database user passwords and connection string in secrets manager."
        ],
        riskOfMistake: "HIGH ⚠️ Standard container restart will trigger a thundering herd connection storm, worsening outage downtime by 15-20 minutes.",
        estimatedTimeToResolution: "35 - 55 minutes (Trial and error)",
        notes: "Generic LLMs lack organizational awareness. They don't know that restarting previously failed or what specific pool configuration your cluster requires."
      },
      withHindsight: {
        recalledMemoryId: match.id,
        diagnosis: `Hindsight Recalled Precedent (${match.id}, ${similarityScore}% match): ${match.rootCause}`,
        suggestedActions: [
          `Proven Fix: ${bestSolution.solution}`,
          `Command: ${bestSolution.actionCommand}`,
          `Historical Effectiveness: ${bestSolution.effectivenessScore}% (Verified by ${bestSolution.approvedBy})`
        ],
        preemptedPitfalls: failedAttempts.length > 0 ? failedAttempts : ['No previous pitfalls recorded; first clean path established.'],
        estimatedTimeToResolution: `${match.avgMttrMinutes} minutes (90% faster MTTR)`,
        confidence: similarityScore,
        provenRemediationScript: bestSolution.actionCommand
      }
    };
  }

  return {
    incidentTitle: incident.title,
    errorSignature: incident.errorSignature,
    withoutMemory: {
      diagnosis: "Generic error analysis: System error detected in application logs.",
      suggestedActions: [
        "1. Check pod status and logs using kubectl.",
        "2. Restart relevant deployments.",
        "3. Check external provider status page."
      ],
      riskOfMistake: "MEDIUM ⚠️ Unknown system state without institutional memory.",
      estimatedTimeToResolution: "45 minutes",
      notes: "First-principles troubleshooting required."
    },
    withHindsight: {
      recalledMemoryId: "NEW_EXPERIENCE_LEARNER",
      diagnosis: "No exact prior incident signature in memory bank yet. Agent analyzes logs using first-principles SRE diagnostic reasoning and will persist the approved solution into Hindsight memory upon resolution.",
      suggestedActions: [
        "Inspect connection saturation metrics and queue wait duration.",
        "Formulate low-risk non-destructive remediation.",
        "Execute with human engineer approval and save outcome to Hindsight memory bank."
      ],
      preemptedPitfalls: ["Blind container restart during active queue backlog"],
      estimatedTimeToResolution: "8 - 12 minutes (with safety guardrails)",
      confidence: 82,
      provenRemediationScript: "kubectl rollout status deployment/" + incident.service
    }
  };
}

export function resetDemoState() {
  currentMemories = JSON.parse(JSON.stringify(initialHindsightMemories));
  currentIncidents = JSON.parse(JSON.stringify(initialIncidents));
  return { success: true, memoriesCount: currentMemories.length, incidentsCount: currentIncidents.length };
}
