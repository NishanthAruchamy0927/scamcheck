import React from 'react';
import { CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { LegitimacyCheck, ManipulationSignal, FalsePositiveContext } from '../types/investigation';

interface LegitimacyCheckViewProps {
  legitimacy?: LegitimacyCheck;
  manipulation?: ManipulationSignal[];
  falsePositives?: FalsePositiveContext[];
}

export const LegitimacyCheckView: React.FC<LegitimacyCheckViewProps> = ({
  legitimacy,
  manipulation,
  falsePositives
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card 1: Legitimacy Check (Balanced Reasoning) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 uppercase">
              BALANCED REASONING
            </span>
            <h3 className="text-base font-bold text-slate-100 font-['Outfit'] mt-0.5">
              Why This Might Still Be Legitimate
            </h3>
          </div>
        </div>

        {legitimacy && legitimacy.positiveIndicators.length > 0 ? (
          <div className="space-y-2">
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              {legitimacy.positiveIndicators.map((ind, idx) => (
                <li key={idx} className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{ind}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed pt-1">
              {legitimacy.rationale}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono leading-relaxed p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            No verifiable positive trust anchors detected. The submission lacks cryptographic enterprise domain authentication and formal screening protocols.
          </p>
        )}

        {/* False Positive Context (Section 13) */}
        {falsePositives && falsePositives.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Contextual False-Positive Awareness:</span>
            </div>
            {falsePositives.map((fp, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] font-mono text-slate-300 space-y-1">
                <div className="font-bold text-amber-300">{fp.signalName}</div>
                <p className="text-slate-400">{fp.potentialBenignExplanation}</p>
                <p className="text-cyan-300">{fp.contextualAdvice}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card 2: Manipulation / Psychological Pressure Signals */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50 uppercase">
              PSYCHOLOGICAL SIGNALS
            </span>
            <h3 className="text-base font-bold text-slate-100 font-['Outfit'] mt-0.5">
              Adversarial Manipulation Patterns
            </h3>
          </div>
        </div>

        {manipulation && manipulation.length > 0 ? (
          <div className="space-y-2.5">
            {manipulation.map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 uppercase">{m.type} TACTIC</span>
                  <span className="text-[10px] text-slate-500 italic truncate max-w-xs">{m.quote}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{m.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono leading-relaxed p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            Zero psychological coercion or artificial deadline pressure detected in the submitted content.
          </p>
        )}
      </div>
    </div>
  );
};
