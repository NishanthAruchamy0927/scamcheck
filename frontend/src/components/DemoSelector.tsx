import React from 'react';
import { Sparkles, ArrowRight, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { DemoCase } from '../types/investigation';

interface DemoSelectorProps {
  demos: DemoCase[];
  onSelectDemo: (demo: DemoCase) => void;
}

export const DemoSelector: React.FC<DemoSelectorProps> = ({ demos, onSelectDemo }) => {
  return (
    <div className="max-w-5xl mx-auto my-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-800/50 text-amber-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>CURATED BENCHMARK SUITE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
          Demonstration Scenarios
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Test ScamCheck's deterministic multi-signal pipeline instantly with calibrated real-world test cases.
        </p>
      </div>

      {/* 4 Demo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demos.map((demo) => {
          const isHighRisk = demo.badge === 'HIGH RISK';
          const isLowRisk = demo.badge === 'LOW RISK';

          const cardBorder = isHighRisk
            ? 'border-rose-900/50 hover:border-rose-700 bg-rose-950/20'
            : isLowRisk
            ? 'border-emerald-900/50 hover:border-emerald-700 bg-emerald-950/20'
            : 'border-amber-900/50 hover:border-amber-700 bg-amber-950/20';

          const icon = isHighRisk ? (
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          ) : isLowRisk ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          );

          return (
            <div
              key={demo.id}
              className={`p-6 rounded-3xl glass-panel border ${cardBorder} space-y-4 flex flex-col justify-between transition-all hover:scale-[1.01]`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {icon}
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                      {demo.category}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded border uppercase ${
                      isHighRisk
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : isLowRisk
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    EXPECTED: {demo.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  {demo.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {demo.description}
                </p>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 line-clamp-3 italic">
                  "{demo.content}"
                </div>
              </div>

              <button
                onClick={() => onSelectDemo(demo)}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/40 font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] group"
              >
                <span>RUN THIS INVESTIGATION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
