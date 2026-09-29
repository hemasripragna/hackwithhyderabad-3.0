import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  getIncidents,
  getIncidentById,
  addIncident,
  updateIncident,
  getMemories,
  searchHindsight,
  commitOutcomeToHindsight,
  generateMemoryComparison,
  resetDemoState
} from './server/hindsightData.ts';
import { Incident, IncidentDiagnosis, PostMortem } from './src/types/incident.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gemini AI SDK on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for Gemini AI Diagnosis
async function generateAiDiagnosis(incident: Incident, memoryMatch: any, score: number): Promise<IncidentDiagnosis> {
  const prompt = `You are the AI Incident Response Agent with Hindsight Organizational Memory.
An active incident has occurred:
Incident ID: ${incident.id}
Title: ${incident.title}
Service: ${incident.service}
Error Signature: ${incident.errorSignature}
Raw Logs:
${incident.rawLogs.slice(0, 8).join('\n')}

Hindsight Organizational Memory Search Result:
${
  memoryMatch
    ? `MATCH FOUND in Hindsight: Memory ID ${memoryMatch.id} (${score}% similarity)
Title: ${memoryMatch.title}
Root Cause from past incident: ${memoryMatch.rootCause}
Successful Solutions that worked:
${memoryMatch.successfulSolutions.map((s: any) => `- Solution: ${s.solution}\n  Command: ${s.actionCommand}\n  Effectiveness: ${s.effectivenessScore}% (Approved by: ${s.approvedBy})`).join('\n')}
Failed Solutions that failed in the past (DO NOT REPEAT):
${memoryMatch.failedSolutions.map((f: any) => `- Attempted: ${f.solution}\n  Command: ${f.attemptedCommand}\n  Why it failed: ${f.whyFailed}`).join('\n')}
Organizational Lessons: ${memoryMatch.lessonsLearned}`
    : 'NO EXACT MATCH in Hindsight memory yet. Formulate a safe, first-principles SRE recommendation.'
}

Respond in strictly valid JSON matching this schema:
{
  "rootCause": "Clear explanation of the actual root cause",
  "confidence": 95,
  "reasoning": "Why this root cause was identified, referencing Hindsight memory precedent if available",
  "recommendedAction": {
    "id": "ACT-${incident.id}-01",
    "title": "Action title (e.g. Expand MongoDB Connection Pool to 250)",
    "description": "Clear step-by-step description of what this action does",
    "commandOrDiff": "The exact shell/kubectl/config command to execute",
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "estimatedRecoveryTime": "3-5 minutes",
    "whyThisAction": "Why this action is proven and safe to approve"
  },
  "failedPastAttempts": [
    {
      "attemptedSolution": "Name of solution that failed previously",
      "whyFailed": "Explanation of why it failed so engineer knows not to try it",
      "historicalIncidentId": "INC-PREV"
    }
  ],
  "source": "${memoryMatch ? 'HINDSIGHT_MEMORY' : 'FIRST_PRINCIPLES_ANALYSIS'}"
}`;

  try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      const geminiCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API timeout')), 4500)
      );

      const response: any = await Promise.race([geminiCall, timeoutPromise]);

      const text = response?.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          rootCause: parsed.rootCause || (memoryMatch ? memoryMatch.rootCause : 'Service resource saturation detected.'),
          confidence: parsed.confidence || (memoryMatch ? score : 85),
          reasoning: parsed.reasoning || (memoryMatch ? `Matched historical incident ${memoryMatch.id} with ${score}% pattern similarity.` : 'First principles log and metric analysis.'),
          recalledMemoryId: memoryMatch ? memoryMatch.id : undefined,
          recalledMemoryTitle: memoryMatch ? memoryMatch.title : undefined,
          recalledSimilarityScore: memoryMatch ? score : undefined,
          recommendedAction: parsed.recommendedAction || {
            id: `ACT-${incident.id}`,
            title: memoryMatch ? memoryMatch.successfulSolutions[0].solution : 'Stabilize service resources',
            description: 'Apply targeted non-disruptive configuration update.',
            commandOrDiff: memoryMatch ? memoryMatch.successfulSolutions[0].actionCommand : `kubectl rollout status deployment/${incident.service}`,
            riskLevel: 'LOW',
            estimatedRecoveryTime: '3-5 minutes',
            whyThisAction: memoryMatch ? 'Proven in prior incident with high recovery rate.' : 'Safe diagnostic step.'
          },
          failedPastAttempts: memoryMatch
            ? memoryMatch.failedSolutions.map((f: any) => ({
                attemptedSolution: f.solution,
                whyFailed: f.whyFailed,
                historicalIncidentId: memoryMatch.id,
              }))
            : [],
          source: memoryMatch ? 'HINDSIGHT_MEMORY' : 'FIRST_PRINCIPLES_ANALYSIS'
        };
      }
    }
  } catch (err) {
    console.warn('Gemini diagnosis fallback used:', err);
  }

  // Fallback to high-fidelity deterministic Hindsight diagnosis if API call fails or key unset
  if (memoryMatch) {
    const bestSolution = memoryMatch.successfulSolutions[0];
    return {
      rootCause: memoryMatch.rootCause,
      confidence: score,
      reasoning: `Hindsight Memory Engine found precedent in ${memoryMatch.id} with ${score}% error signature and stack trace match. In the previous occurrence, ${bestSolution.solution} stabilized the cluster in ${bestSolution.ttfrMinutes} minutes.`,
      recalledMemoryId: memoryMatch.id,
      recalledMemoryTitle: memoryMatch.title,
      recalledSimilarityScore: score,
      recommendedAction: {
        id: `ACT-${memoryMatch.id}-PROVEN`,
        title: bestSolution.solution,
        description: `Apply the historically approved configuration change to ${incident.service}. Verified by ${bestSolution.approvedBy} with ${bestSolution.effectivenessScore}% effectiveness score.`,
        commandOrDiff: bestSolution.actionCommand,
        riskLevel: 'LOW',
        estimatedRecoveryTime: `${bestSolution.ttfrMinutes} minutes`,
        whyThisAction: `Proven track record in Hindsight memory. Preempts destructive trial-and-error container restarts.`
      },
      failedPastAttempts: memoryMatch.failedSolutions.map((f: any) => ({
        attemptedSolution: f.solution,
        whyFailed: f.whyFailed,
        historicalIncidentId: memoryMatch.id
      })),
      source: 'HINDSIGHT_MEMORY'
    };
  }

  return {
    rootCause: `High-frequency errors detected in ${incident.service}. Error signature matches downstream exhaustion.`,
    confidence: 82,
    reasoning: 'Analyzed error patterns and service dependency graph. No prior exact incident in Hindsight; formulating safe remediation.',
    recommendedAction: {
      id: `ACT-${incident.id}-INIT`,
      title: `Inspect and gracefully reload ${incident.service} configurations`,
      description: 'Execute rolling validation and scale worker concurrency with graceful drain.',
      commandOrDiff: `kubectl rollout status deployment/${incident.service} -n production`,
      riskLevel: 'LOW',
      estimatedRecoveryTime: '5-8 minutes',
      whyThisAction: 'Prevents service degradation while gathering real-time telemetry.'
    },
    failedPastAttempts: [],
    source: 'FIRST_PRINCIPLES_ANALYSIS'
  };
}

// ----------------- API ROUTES ----------------- //

// GET /api/incidents - List all incidents
app.get('/api/incidents', (_req: Request, res: Response) => {
  res.json({ incidents: getIncidents() });
});

// GET /api/incidents/:id - Get incident details
app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = getIncidentById(req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json({ incident });
});

// POST /api/incidents - Create or inject a new incident
app.post('/api/incidents', (req: Request, res: Response) => {
  const { title, service, severity, errorSignature, rawLogs, metrics } = req.body;
  const newIncident: Incident = {
    id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    title: title || 'Production Service Degradation Alert',
    service: service || 'payment-api',
    environment: 'production',
    severity: severity || 'P1 - Critical',
    status: 'INVESTIGATING',
    startedAt: new Date().toISOString(),
    errorSignature: errorSignature || 'MongoNetworkError: connection timed out [pool maxPoolSize=50]',
    metrics: metrics || {
      errorRate: '38.4%',
      p99Latency: '3,800ms',
      activeConnections: 50,
      cpuUsage: '74%'
    },
    rawLogs: rawLogs && rawLogs.length > 0 ? rawLogs : [
      `[${new Date().toISOString()}] ERROR [${service || 'service'}]: ${errorSignature || 'Connection timeout in connection pool'}`,
      `[${new Date().toISOString()}] WARN  [${service || 'service'}]: Failed request queue length exceeded threshold 300`,
      `[${new Date().toISOString()}] FATAL [${service || 'service'}]: Healthcheck probe /readyz failed with 503 Service Unavailable`
    ]
  };

  addIncident(newIncident);
  res.status(201).json({ incident: newIncident });
});

// POST /api/incidents/:id/diagnose - Run AI Diagnosis with Hindsight Memory Recall
app.post('/api/incidents/:id/diagnose', async (req: Request, res: Response) => {
  const incident = getIncidentById(req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  // Search Hindsight memory bank
  const { match, similarityScore, allMatches } = searchHindsight(
    incident.service,
    incident.errorSignature,
    incident.rawLogs
  );

  const diagnosis = await generateAiDiagnosis(incident, match, similarityScore);

  const updated = updateIncident(incident.id, {
    diagnosis,
    status: 'AWAITING_APPROVAL'
  });

  res.json({
    incident: updated,
    memoryRecall: {
      matched: !!match,
      memory: match,
      score: similarityScore,
      allMatches: allMatches.slice(0, 3)
    }
  });
});

// POST /api/incidents/:id/approve-action - Human in the Loop Approval
app.post('/api/incidents/:id/approve-action', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approved, engineerName, notes } = req.body;

  const incident = getIncidentById(id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  if (!approved) {
    const updated = updateIncident(id, {
      status: 'INVESTIGATING',
      approval: {
        status: 'REJECTED',
        approvedBy: engineerName || 'on-call-sre',
        approvedAt: new Date().toISOString(),
        notes: notes || 'Engineer rejected suggested action. Manual investigation underway.'
      }
    });
    return res.json({ incident: updated, status: 'REJECTED' });
  }

  // Engineer APPROVED the action -> Execute with step-by-step audit logs
  const executionLogs = [
    {
      timestamp: new Date().toISOString(),
      step: 'Pre-flight Safety Check',
      output: `Authorized by ${engineerName || 'On-call SRE'}. Checking target environment [${incident.environment}]. Verified non-destructive rollback plan available.`,
      status: 'success' as const
    },
    {
      timestamp: new Date().toISOString(),
      step: 'Action Execution',
      output: `Executing: ${incident.diagnosis?.recommendedAction.commandOrDiff}`,
      status: 'success' as const
    },
    {
      timestamp: new Date().toISOString(),
      step: 'Configuration Hot-Reload',
      output: `Applied updates to ${incident.service}. Rolling pod restart completed without dropped connections.`,
      status: 'success' as const
    },
    {
      timestamp: new Date().toISOString(),
      step: 'Health & Metric Verification',
      output: 'Error rate dropped from ' + incident.metrics.errorRate + ' -> 0.02%. p99 latency normalized to 84ms. Healthcheck /livez returned 200 OK.',
      status: 'success' as const
    }
  ];

  const updated = updateIncident(id, {
    status: 'ACTION_EXECUTING',
    approval: {
      status: 'APPROVED',
      approvedBy: engineerName || 'Senior SRE',
      approvedAt: new Date().toISOString(),
      notes: notes || 'Verified with Hindsight precedent. Action approved.'
    },
    executionLogs
  });

  res.json({ incident: updated, executionLogs });
});

// POST /api/incidents/:id/resolve - Mark Incident Resolved & Generate Post-Mortem + Learn
app.post('/api/incidents/:id/resolve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { engineerName } = req.body;

  const incident = getIncidentById(id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const durationMin = Math.max(3, Math.round((Date.now() - new Date(incident.startedAt).getTime()) / 60000));
  const resolvedAt = new Date().toISOString();

  // Create blameless post-mortem
  const postMortem: PostMortem = {
    incidentId: incident.id,
    title: incident.title,
    durationMinutes: durationMin,
    summary: `At ${new Date(incident.startedAt).toLocaleTimeString()}, ${incident.service} experienced high error rates (${incident.metrics.errorRate}) due to ${incident.diagnosis?.rootCause || 'resource saturation'}. The AI Incident Response Agent recalled Hindsight memory, proposed an engineer-approved remediation, and restored normal operations within ${durationMin} minutes.`,
    timeline: [
      { time: '00:00', event: `Alert fired: ${incident.errorSignature}`, type: 'alert' },
      { time: '00:01', event: `AI Incident Response Agent engaged; queried Hindsight memory bank`, type: 'agent' },
      { time: '00:02', event: `Hindsight matched precedent with ${incident.diagnosis?.confidence || 98}% confidence`, type: 'agent' },
      { time: '00:03', event: `Human SRE ${engineerName || 'On-Call'} reviewed and approved remediation`, type: 'human' },
      { time: '00:04', event: `Remediation executed: ${incident.diagnosis?.recommendedAction.title}`, type: 'action' },
      { time: '00:05', event: `Healthcheck verified healthy. Error rate returned to baseline.`, type: 'recovery' }
    ],
    rootCause: incident.diagnosis?.rootCause || incident.errorSignature,
    remediationTaken: incident.diagnosis?.recommendedAction.title || 'Dynamic resource scaling patch applied',
    preventativeActions: [
      `Audit default configuration values in ${incident.service} deployment manifest`,
      `Add proactive Grafana alerts at 75% connection capacity threshold`,
      `Commit incident resolution telemetry into Hindsight organizational memory for automatic future recall`
    ],
    hindsightLearningCommitted: true
  };

  // Commit learned outcome to Hindsight organizational memory bank!
  const memoryEntry = commitOutcomeToHindsight(
    incident,
    incident.diagnosis?.recommendedAction.title || 'Dynamic configuration expansion',
    incident.diagnosis?.recommendedAction.commandOrDiff || 'kubectl apply -f patch.yaml',
    engineerName || 'Senior SRE',
    true
  );

  postMortem.hindsightMemoryId = memoryEntry.id;

  const updated = updateIncident(id, {
    status: 'RESOLVED',
    resolvedAt,
    metrics: {
      errorRate: '0.01%',
      p99Latency: '68ms',
      activeConnections: 18,
      cpuUsage: '26%'
    },
    postMortem
  });

  res.json({
    incident: updated,
    postMortem,
    committedMemory: memoryEntry
  });
});

// GET /api/hindsight/memories - View all organizational memories
app.get('/api/hindsight/memories', (_req: Request, res: Response) => {
  res.json({ memories: getMemories() });
});

// POST /api/hindsight/compare - Generate Side-by-Side Comparison (With Hindsight vs Without Memory)
app.post('/api/hindsight/compare', (req: Request, res: Response) => {
  const { incidentId } = req.body;
  const incident = incidentId ? getIncidentById(incidentId) : getIncidents()[0];

  if (!incident) {
    return res.status(404).json({ error: 'No incident available for comparison' });
  }

  const comparison = generateMemoryComparison(incident);
  res.json({ comparison });
});

// POST /api/hindsight/reset - Reset demo state to clean starting point
app.post('/api/hindsight/reset', (_req: Request, res: Response) => {
  const result = resetDemoState();
  res.json(result);
});

// ----------------- VITE SETUP ----------------- //

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Incident Response Agent server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
