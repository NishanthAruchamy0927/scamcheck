import React from 'react';
import {
  OctagonAlert,
  ShieldCheck,
  Search,
  CheckSquare,
  LifeBuoy,
  Compass,
  ArrowRight
} from 'lucide-react';
import { RecommendedAction } from '../types/investigation';

interface ActionRecommendationsProps {
  action: RecommendedAction;
}

export const ActionRecommendations: React.FC<ActionRecommendationsProps> = ({ action }) => {
  const isStop = action.primaryVerdict === 'STOP';
  const isVerify = action.primaryVerdict === 'VERIFY';

  const verdictBadgeStyle = isStop
    ? 'bg-rose-950 text-rose-300 border-rose-600 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
    : isVerify
    ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
    : 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.35)]';

  const icon = isStop ? (
    <OctagonAlert className="w-8 h-8 text-rose-400" />
  ) : isVerify ? (
    <Search className="w-8 h-8 text-amber-400" />
  ) : (
    <ShieldCheck className="w-8 h-8 text-emerald-400" />
  );

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
      {/* Primary Action Banner */}
      <div className={`p-6 rounded-2xl border ${verdictBadgeStyle} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex-shrink-0">
            {icon}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold tracking-widest uppercase">
                STRATEGIC PLAYBOOK // VERDICT:
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-extrabold bg-black/60">
                {action.primaryVerdict.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold font-['Outfit'] mt-1 text-white">
              {action.headline}
            </h3>
          </div>
        </div>
      </div>

      {/* Grid of Action Steps & Verification Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Immediate Action Steps */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span>Immediate Response Steps</span>
          </div>
          <ul className="space-y-2.5">
            {action.actionSteps.map((step, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300 leading-relaxed">
                <span className="font-mono text-cyan-400 font-bold mt-0.5">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Official Verification Roadmap */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
            <Compass className="w-4 h-4 text-teal-400" />
            <span>Independent Verification Roadmap</span>
          </div>
          <ul className="space-y-2.5">
            {action.officialVerificationGuide.map((guide, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300 leading-relaxed">
                <ArrowRight className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>{guide}</span>
              </li>
            ))}
          </ul>

          {/* Safety Principles */}
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
              <span>Cybersecurity Rule of Thumb:</span>
            </span>
            <p className="text-xs text-slate-400 italic">
              {action.safetyTips[0] || 'Never send funds or identity documents prior to cryptographic domain verification.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
