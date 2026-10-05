import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { TrustProfile } from '../types/investigation';

interface TrustProfileViewProps {
  profile?: TrustProfile;
}

export const TrustProfileView: React.FC<TrustProfileViewProps> = ({ profile }) => {
  if (!profile) return null;

  const getMeterColor = (val: number) => {
    if (val >= 70) return 'bg-emerald-500 shadow-[0_0_10px_#10b981]';
    if (val >= 40) return 'bg-amber-500 shadow-[0_0_10px_#f59e0b]';
    return 'bg-rose-500 shadow-[0_0_10px_#ef4444]';
  };

  const dimensions = [
    { label: 'Identity Consistency', value: profile.identityConsistency, desc: 'Alignment between claimed brand and verifiable credentials' },
    { label: 'Contact Consistency', value: profile.contactConsistency, desc: 'Corporate email vs unverified public mailbox' },
    { label: 'Process Consistency', value: profile.processConsistency, desc: 'Standard hiring assessments vs instant pressure' },
    { label: 'Financial Safety', value: profile.financialSafety, desc: 'Absence of candidate upfront fees/deposits' },
    { label: 'Evidence Strength', value: profile.evidenceStrength, desc: 'Completeness and corroboration of available submission data', isStrength: true }
  ];

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-teal-950/80 border border-teal-800/60 flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/50 uppercase">
                TRUST DYNAMICS
              </span>
              <span className="text-xs font-mono text-slate-400">
                5-Vector Evidence Integrity Profile
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white font-['Outfit'] mt-0.5">
              Opportunity Trust Profile
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {dimensions.map((dim, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border space-y-2 ${
              dim.isStrength
                ? 'bg-cyan-950/20 border-cyan-800/40 sm:col-span-2 lg:col-span-2'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">{dim.label}</span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {dim.value}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className={`h-full ${dim.isStrength ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : getMeterColor(dim.value)} transition-all duration-500`}
                style={{ width: `${dim.value}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {dim.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 flex items-start space-x-2 text-[11px] text-slate-400 font-mono">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Evidence Strength ({profile.evidenceStrength}/100)</strong> measures the completeness of evidence analyzed. High evidence strength does not mean legitimate; it indicates sufficient data for high assessment confidence.
        </span>
      </div>
    </div>
  );
};
