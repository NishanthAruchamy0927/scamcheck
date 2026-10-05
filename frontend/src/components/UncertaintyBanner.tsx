import React from 'react';
import { ArrowRight, ShieldQuestion } from 'lucide-react';
import { UncertaintyHandling } from '../types/investigation';

interface UncertaintyBannerProps {
  uncertainty: UncertaintyHandling;
}

export const UncertaintyBanner: React.FC<UncertaintyBannerProps> = ({ uncertainty }) => {
  if (!uncertainty.isAmbiguous) return null;

  return (
    <div className="p-6 rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] space-y-4">
      <div className="flex items-start space-x-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0 mt-0.5">
          <ShieldQuestion className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 uppercase">
              RESPONSIBLE AI REFUSAL GATE
            </span>
          </div>
          <h4 className="text-base font-extrabold text-slate-100 font-['Outfit']">
            Insufficient Evidence For Definitive Verification
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {uncertainty.refusalExplanation ||
              "ScamCheck does not force inconclusive submissions into blunt safe/scam verdicts. Available evidence is sparse or lacks cryptographic domain anchors."}
          </p>
        </div>
      </div>

      {/* Missing Evidence List */}
      {uncertainty.missingEvidence.length > 0 && (
        <div className="pt-2 border-t border-amber-900/40 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
              Identified Information Gaps:
            </span>
            <ul className="space-y-1.5">
              {uncertainty.missingEvidence.map((gap, i) => (
                <li key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="text-amber-400 font-mono font-bold">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
              Recommended Steps to Acquire Proof:
            </span>
            <ul className="space-y-1.5">
              {uncertainty.guidanceToAcquire.map((item, i) => (
                <li key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
