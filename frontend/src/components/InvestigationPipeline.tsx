import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Search,
  ShieldAlert,
  Terminal,
  Activity,
  Zap,
  Lock,
  Globe
} from 'lucide-react';

interface StageItem {
  id: number;
  label: string;
  detail: string;
  icon: React.ReactNode;
}

const STAGES: StageItem[] = [
  {
    id: 1,
    label: 'Content Ingestion & Normalization',
    detail: 'Raw submission sanitized; stripping noise and encoding UTF-8 tokens.',
    icon: <Terminal className="w-4 h-4 text-cyan-400" />
  },
  {
    id: 2,
    label: 'Opportunity Classification',
    detail: 'Categorizing opportunity tier (Internship, Full-time, Fellowship, Freelance).',
    icon: <Search className="w-4 h-4 text-blue-400" />
  },
  {
    id: 3,
    label: 'Brand & Organization Entity Extraction',
    detail: 'Resolving employer footprint against verified corporate registries.',
    icon: <Globe className="w-4 h-4 text-teal-400" />
  },
  {
    id: 4,
    label: 'Recruiter & Ingestion Channel Audit',
    detail: 'Inspecting sender email headers, phone carriers, and messaging platform routes.',
    icon: <Activity className="w-4 h-4 text-purple-400" />
  },
  {
    id: 5,
    label: 'Financial Demand & Advance-Fee Triage',
    detail: 'Scanning for disguised registration fees, kit deposits, or training mandates.',
    icon: <Lock className="w-4 h-4 text-rose-400" />
  },
  {
    id: 6,
    label: 'Psychological Urgency Analysis',
    detail: 'Evaluating artificial 24h deadline pressure, FOMO, and scarce slot triggers.',
    icon: <Zap className="w-4 h-4 text-amber-400" />
  },
  {
    id: 7,
    label: 'Domain & Recruiter Consistency Matrix',
    detail: 'Verifying DNS, lookalike domains, and public webmail impersonation vectors.',
    icon: <ShieldAlert className="w-4 h-4 text-cyan-400" />
  },
  {
    id: 8,
    label: 'Deterministic Pattern & Evidence Assembly',
    detail: 'Executing 22+ weighted security rules and constructing evidence chain.',
    icon: <Cpu className="w-4 h-4 text-emerald-400" />
  },
  {
    id: 9,
    label: 'Risk & Confidence Synthesis',
    detail: 'Calculating calibrated 0–100 risk score and independent confidence rating.',
    icon: <CheckCircle2 className="w-4 h-4 text-cyan-300" />
  }
];

interface InvestigationPipelineProps {
  onComplete?: () => void;
}

export const InvestigationPipeline: React.FC<InvestigationPipelineProps> = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length) {
          const next = prev + 1;
          const stage = STAGES[prev];
          if (stage) {
            setLogs((l) => [
              `[${new Date().toLocaleTimeString()}] ✔ STAGE_${stage.id}: ${stage.label} — OK`,
              ...l.slice(0, 5)
            ]);
          }
          if (next >= STAGES.length && onComplete) {
            setTimeout(onComplete, 400);
          }
          return next;
        }
        return prev;
      });
    }, 280); // Fast, realistic cyber investigation speed (~2.5s total)

    return () => clearInterval(stageInterval);
  }, [onComplete]);

  const progressPercent = Math.min(100, Math.round((currentStage / STAGES.length) * 100));

  return (
    <div className="max-w-3xl mx-auto my-12">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
        {/* Radar Background Visualizer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-cyan-500/10 rounded-full pointer-events-none">
          <div className="w-full h-full border border-cyan-500/10 rounded-full animate-ping opacity-20" />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
              <div className="absolute inset-0 rounded-xl border border-cyan-400/40 animate-ping opacity-30" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                Active SOC Investigation In Progress
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Threat Intelligence Matrix // Processing Multi-Signal Evidence
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-mono font-extrabold text-cyan-300">
              {progressPercent}%
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Analysis Completion</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-6 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Staged Pipeline List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {STAGES.map((stage, idx) => {
            const isFinished = idx < currentStage;
            const isRunning = idx === currentStage;

            return (
              <div
                key={stage.id}
                className={`flex items-start space-x-3 p-3 rounded-xl border transition-all ${
                  isFinished
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                    : isRunning
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.01]'
                    : 'bg-slate-950/40 border-slate-900/60 text-slate-600 opacity-60'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isFinished ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isRunning ? (
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-mono text-slate-600">
                      {stage.id}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide">
                      {stage.label}
                    </span>
                    {isRunning && (
                      <span className="text-[10px] font-mono font-bold text-cyan-400 animate-pulse bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        PROCESSING
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {stage.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Telemetry Log Footer */}
        {logs.length > 0 && (
          <div className="mt-5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Telemetry Feed:</span>
            </div>
            {logs.slice(0, 2).map((log, i) => (
              <div key={i} className="text-slate-300 truncate">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
