import React, { useState } from 'react';
import { Sliders, RotateCcw, ArrowRight } from 'lucide-react';

interface WhatIfSimulatorProps {
  initialScore: number;
  hasPayment: boolean;
  hasDomainMismatch: boolean;
  hasUrgency: boolean;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  initialScore,
  hasPayment,
  hasDomainMismatch,
  hasUrgency
}) => {
  const [removedPayment, setRemovedPayment] = useState(false);
  const [verifiedDomain, setVerifiedDomain] = useState(false);
  const [verifiedProcess, setVerifiedProcess] = useState(false);
  const [removedUrgency, setRemovedUrgency] = useState(false);

  // Compute simulated projected score
  let projectedScore = initialScore;

  if (removedPayment && hasPayment) projectedScore -= 35;
  if (verifiedDomain && hasDomainMismatch) projectedScore -= 30;
  if (verifiedProcess) projectedScore -= 15;
  if (removedUrgency && hasUrgency) projectedScore -= 15;

  projectedScore = Math.max(0, Math.min(100, projectedScore));

  let projectedTier = 'LOW RISK';
  let projectedTierStyle = 'bg-emerald-950 text-emerald-300 border-emerald-700';
  if (projectedScore >= 61) {
    projectedTier = 'HIGH RISK';
    projectedTierStyle = 'bg-rose-950 text-rose-300 border-rose-700';
  } else if (projectedScore >= 31) {
    projectedTier = 'NEEDS VERIFICATION';
    projectedTierStyle = 'bg-amber-950 text-amber-300 border-amber-700';
  }

  const handleReset = () => {
    setRemovedPayment(false);
    setVerifiedDomain(false);
    setVerifiedProcess(false);
    setRemovedUrgency(false);
  };

  const isModified = removedPayment || verifiedDomain || verifiedProcess || removedUrgency;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50 uppercase">
                SCENARIO SIMULATOR
              </span>
              <span className="text-xs font-mono text-slate-400">
                Interactive Risk Sensitivity Model
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white font-['Outfit'] mt-0.5">
              What-If Risk Sensitivity Analysis
            </h3>
          </div>
        </div>

        {isModified && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono hover:text-white transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Simulation</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Toggle Controls */}
        <div className="space-y-3 md:col-span-2 text-xs font-mono">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:bg-slate-900">
            <span className="text-slate-300">Hypothetical: Candidate fees eliminated (Zero upfront charge)</span>
            <input
              type="checkbox"
              checked={removedPayment}
              onChange={(e) => setRemovedPayment(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:bg-slate-900">
            <span className="text-slate-300">Hypothetical: Recruiter verified via official corporate domain (@company.com)</span>
            <input
              type="checkbox"
              checked={verifiedDomain}
              onChange={(e) => setVerifiedDomain(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:bg-slate-900">
            <span className="text-slate-300">Hypothetical: Verified through official multi-stage coding assessment</span>
            <input
              type="checkbox"
              checked={verifiedProcess}
              onChange={(e) => setVerifiedProcess(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:bg-slate-900">
            <span className="text-slate-300">Hypothetical: 24h urgency pressure removed</span>
            <input
              type="checkbox"
              checked={removedUrgency}
              onChange={(e) => setRemovedUrgency(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Projected Score Outcome Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Simulated Risk Delta</div>

          <div className="flex items-center justify-center space-x-3">
            <div className="text-slate-400 font-mono text-lg">{initialScore}</div>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            <div className="text-3xl font-extrabold text-white font-mono">{projectedScore}</div>
          </div>

          <div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${projectedTierStyle}`}>
              PROJECTED: {projectedTier}
            </span>
          </div>

          <p className="text-[10px] text-slate-500 font-mono leading-tight">
            Model scenario simulation: Transparent projection based on calibrated deterministic scoring weights.
          </p>
        </div>
      </div>
    </div>
  );
};
