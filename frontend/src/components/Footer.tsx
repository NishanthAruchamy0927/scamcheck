import React from 'react';
import { ShieldCheck, Cpu, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="glass-panel border-t border-slate-800/80 bg-[#07090e]/90 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Branding & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white font-['Outfit'] tracking-wider">
                SCAMCHECK
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                AI OPPORTUNITY INTEL
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Transforming opportunity verification through multi-signal AI intelligence. Don't just detect scams — investigate the opportunity.
            </p>
            <div className="flex items-center space-x-4 pt-1 text-xs text-slate-500 font-mono">
              <span className="flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hybrid Rule + NLP Engine</span>
              </span>
              <span className="flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Data Ingestion Retain</span>
              </span>
            </div>
          </div>

          {/* Col 2: Core Capabilities */}
          <div className="space-y-2 text-xs font-mono">
            <span className="font-bold text-slate-200 uppercase tracking-wider">Detection Matrix</span>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Advance-Fee Detection</li>
              <li>• Credential Harvesting</li>
              <li>• Domain Spoofing Triage</li>
              <li>• Urgency Manipulation</li>
              <li>• Task-Based Rating Scams</li>
            </ul>
          </div>

          {/* Col 3: Ethical & Security Directives */}
          <div className="space-y-2 text-xs font-mono">
            <span className="font-bold text-slate-200 uppercase tracking-wider">Security Principles</span>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Explainable Evidence Graph</li>
              <li>• Refusal & Uncertainty Gate</li>
              <li>• Non-Definitive Risk Scoring</li>
              <li>• Independent Verification</li>
            </ul>
          </div>
        </div>

        {/* Responsible AI Disclaimer Banner */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[11px] text-slate-500 font-mono max-w-3xl leading-relaxed">
            <strong>Responsible AI Notice:</strong> ScamCheck provides algorithmic risk indicators and evidence-based threat signals, not definitive legal proof of criminal fraud. Always independently cross-reference opportunities through verified corporate websites.
          </p>
          <div className="text-[11px] font-mono text-slate-600 flex-shrink-0">
            SCAMCHECK v1.0.0 // 2026
          </div>
        </div>
      </div>
    </footer>
  );
};
