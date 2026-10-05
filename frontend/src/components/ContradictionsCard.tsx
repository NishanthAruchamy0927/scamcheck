import React from 'react';
import { Split, AlertOctagon } from 'lucide-react';
import { Contradiction } from '../types/investigation';

interface ContradictionsCardProps {
  contradictions?: Contradiction[];
}

export const ContradictionsCard: React.FC<ContradictionsCardProps> = ({ contradictions }) => {
  if (!contradictions || contradictions.length === 0) return null;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-rose-900/40 bg-rose-950/10 space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-rose-900/30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <Split className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50 uppercase">
                CONTRADICTION ENGINE
              </span>
              <span className="text-xs font-mono text-rose-400">
                {contradictions.length} Logical Conflict{contradictions.length > 1 ? 's' : ''} Detected
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white font-['Outfit'] mt-0.5">
              Cross-Claim Inconsistencies & Contradictions
            </h3>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {contradictions.map((contra) => (
          <div
            key={contra.id}
            className="p-4 rounded-2xl bg-slate-950/80 border border-rose-900/50 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="text-xs font-bold text-rose-300 font-mono">
                  CONFLICT: {contra.type.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300">
                {contra.severity}
              </span>
            </div>

            {/* Side-by-side claim comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-[10px] text-slate-500 block uppercase">Claimed Attribute A:</span>
                <span className="font-semibold text-cyan-300">{contra.claimA}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-[10px] text-slate-500 block uppercase">Conflicting Evidence B:</span>
                <span className="font-semibold text-rose-300">{contra.claimB}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-rose-950/30 p-2.5 rounded-xl border border-rose-900/30">
              {contra.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
