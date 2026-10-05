import React from 'react';
import {
  DollarSign,
  KeyRound,
  FileBadge,
  Briefcase,
  EyeOff
} from 'lucide-react';
import { PotentialExposure, ExposureLevel } from '../types/investigation';

interface PotentialExposureProps {
  exposure: PotentialExposure;
}

export const PotentialExposureView: React.FC<PotentialExposureProps> = ({ exposure }) => {
  const getLevelStyle = (level: ExposureLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          badge: 'bg-rose-950/80 text-rose-300 border-rose-700',
          bar: 'bg-rose-500 shadow-[0_0_10px_#ef4444]',
          width: '100%',
          text: 'CRITICAL THREAT'
        };
      case 'HIGH':
        return {
          badge: 'bg-amber-950/80 text-amber-300 border-amber-700',
          bar: 'bg-amber-500 shadow-[0_0_10px_#f59e0b]',
          width: '75%',
          text: 'HIGH EXPOSURE'
        };
      case 'MEDIUM':
        return {
          badge: 'bg-yellow-950/80 text-yellow-300 border-yellow-700',
          bar: 'bg-yellow-500',
          width: '50%',
          text: 'MEDIUM RISK'
        };
      case 'LOW':
        return {
          badge: 'bg-blue-950/80 text-blue-300 border-blue-700',
          bar: 'bg-blue-500',
          width: '25%',
          text: 'LOW CONCERN'
        };
      default:
        return {
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-700',
          bar: 'bg-emerald-500',
          width: '5%',
          text: 'NONE DETECTED'
        };
    }
  };

  const categories = [
    {
      title: 'Potential Financial Exposure',
      level: exposure.financialLevel,
      amount: exposure.financialAmount !== '₹0 / $0' ? exposure.financialAmount : null,
      notes: exposure.financialNotes,
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />
    },
    {
      title: 'Credential Takeover Threat',
      level: exposure.credentialLevel,
      amount: null,
      notes: exposure.credentialNotes,
      icon: <KeyRound className="w-4 h-4 text-rose-400" />
    },
    {
      title: 'Identity Document Exposure',
      level: exposure.identityLevel,
      amount: null,
      notes: exposure.identityNotes,
      icon: <FileBadge className="w-4 h-4 text-amber-400" />
    },
    {
      title: 'Labor Exploitation & Time Loss',
      level: exposure.employmentLevel,
      amount: null,
      notes: exposure.employmentNotes,
      icon: <Briefcase className="w-4 h-4 text-blue-400" />
    },
    {
      title: 'Communication & Data Privacy Risk',
      level: exposure.privacyLevel,
      amount: null,
      notes: exposure.privacyNotes,
      icon: <EyeOff className="w-4 h-4 text-purple-400" />
    }
  ];

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50 uppercase">
            IMPACT VULNERABILITY
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Quantified Threat Surface
          </span>
        </div>
        <h3 className="text-xl font-extrabold text-white font-['Outfit'] mt-1">
          Potential Exposure Breakdown
        </h3>
        <p className="text-xs text-slate-400">
          Evaluates multi-dimensional liability vectors across financial, credential, identity, and personal privacy domains.
        </p>
      </div>

      {/* Grid of Exposure Cards */}
      <div className="space-y-4">
        {categories.map((cat, i) => {
          const style = getLevelStyle(cat.level);
          return (
            <div
              key={i}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                    {cat.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200">{cat.title}</span>
                    {cat.amount && (
                      <span className="ml-2 font-mono font-bold text-xs text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/50">
                        {cat.amount}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${style.badge}`}
                >
                  {style.text}
                </span>
              </div>

              {/* Meter bar */}
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className={`h-full ${style.bar} transition-all duration-500`}
                  style={{ width: style.width }}
                />
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pl-1 pt-1">
                {cat.notes}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
