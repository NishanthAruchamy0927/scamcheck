import React from 'react';
import { Dna, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { OpportunityDna } from '../types/investigation';

interface OpportunityDnaCardProps {
  dna?: OpportunityDna;
}

export const OpportunityDnaCard: React.FC<OpportunityDnaCardProps> = ({ dna }) => {
  if (!dna) return null;

  const getStatusIcon = (status: 'MATCH' | 'MISMATCH' | 'UNKNOWN') => {
    if (status === 'MATCH') {
      return (
        <span className="flex items-center space-x-1 text-emerald-400 font-bold text-xs font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>✓ CONSISTENT</span>
        </span>
      );
    }
    if (status === 'MISMATCH') {
      return (
        <span className="flex items-center space-x-1 text-rose-400 font-bold text-xs font-mono">
          <XCircle className="w-3.5 h-3.5" />
          <span>✗ MISMATCH</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 text-amber-400 font-bold text-xs font-mono">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>⚠ UNVERIFIED</span>
      </span>
    );
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
                IDENTITY FINGERPRINT
              </span>
              <span className="text-xs font-mono text-slate-400">
                Evidence Completeness: <strong>{dna.evidenceCompleteness}%</strong>
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white font-['Outfit'] mt-0.5">
              Opportunity DNA & Consistency Blueprint
            </h3>
          </div>
        </div>

        {/* Evidence Completeness mini-meter */}
        <div className="w-full sm:w-44 space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Completeness</span>
            <span className="text-cyan-300 font-bold">{dna.evidenceCompleteness}%</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${dna.evidenceCompleteness}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5-Point Consistency Vector Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Organization */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Organization</div>
          <div className="text-xs font-bold text-slate-200 truncate">{dna.organization}</div>
          <div>{getStatusIcon(dna.consistencyFingerprint.organization)}</div>
        </div>

        {/* Recruiter */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Recruiter Identity</div>
          <div className="text-xs font-bold text-slate-200 truncate">{dna.recruiter}</div>
          <div>{getStatusIcon(dna.consistencyFingerprint.recruiter)}</div>
        </div>

        {/* Contact Channel */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Contact Channel</div>
          <div className="text-xs font-bold text-slate-200 truncate font-mono text-[11px]">{dna.contact}</div>
          <div>{getStatusIcon(dna.consistencyFingerprint.contact)}</div>
        </div>

        {/* Payment Policy */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Payment Safety</div>
          <div className="text-xs font-bold text-slate-200 truncate">{dna.payment}</div>
          <div>{getStatusIcon(dna.consistencyFingerprint.payment)}</div>
        </div>

        {/* Selection Process */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Hiring Protocol</div>
          <div className="text-xs font-bold text-slate-200 truncate">{dna.selection}</div>
          <div>{getStatusIcon(dna.consistencyFingerprint.process)}</div>
        </div>
      </div>
    </div>
  );
};
