import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Quote,
  Zap,
  Info,
  Filter,
  ArrowDown,
  FileSearch,
  Sparkles
} from 'lucide-react';
import { EvidenceNode } from '../types/investigation';

interface EvidenceChainProps {
  evidenceChain: EvidenceNode[];
  rawSnippet?: string;
}

export const EvidenceChain: React.FC<EvidenceChainProps> = ({ evidenceChain, rawSnippet }) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    evidenceChain.length > 0 ? evidenceChain[0].id : null
  );
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [showSourceInspector, setShowSourceInspector] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredNodes = evidenceChain.filter((node) => {
    if (filterSeverity === 'ALL') return true;
    return node.severity === filterSeverity;
  });

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
              EVIDENCE-FIRST DESIGN
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {evidenceChain.length} Verified Evidence Nodes
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white font-['Outfit'] mt-1">
            Explainable Evidence Chain
          </h3>
          <p className="text-xs text-slate-400">
            Traces forensic progression from raw submission → extracted claim → detected signal → calibrated risk contribution.
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {rawSnippet && (
            <button
              onClick={() => setShowSourceInspector(!showSourceInspector)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl border text-xs font-mono transition-all ${
                showSourceInspector
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>{showSourceInspector ? 'Hide Source' : 'Inspect Source'}</span>
            </button>
          )}

          {/* Filter Chips */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              onClick={() => setFilterSeverity('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'ALL'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({evidenceChain.length})
            </button>
            <button
              onClick={() => setFilterSeverity('CRITICAL')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'CRITICAL'
                  ? 'bg-rose-900/80 text-rose-200 font-bold'
                  : 'text-rose-400/70 hover:text-rose-300'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilterSeverity('HIGH')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'HIGH'
                  ? 'bg-amber-900/80 text-amber-200 font-bold'
                  : 'text-amber-400/70 hover:text-amber-300'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setFilterSeverity('POSITIVE')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'POSITIVE'
                  ? 'bg-emerald-900/80 text-emerald-200 font-bold'
                  : 'text-emerald-400/70 hover:text-emerald-300'
              }`}
            >
              Positive
            </button>
          </div>
        </div>
      </div>

      {/* Optional Source Text Inspector */}
      {showSourceInspector && rawSnippet && (
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-800/40 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>RAW SUBMITTED TEXT // VERBATIM EVIDENCE INSPECTOR</span>
            </span>
            <span className="text-slate-500">{rawSnippet.length} characters</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {rawSnippet}
          </div>
        </div>
      )}

      {/* Nodes List */}
      {filteredNodes.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs font-mono">
          No evidence nodes matching this filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNodes.map((node, index) => {
            const isExpanded = expandedId === node.id;
            const isCritical = node.severity === 'CRITICAL';
            const isHigh = node.severity === 'HIGH';
            const isPositive = node.severity === 'POSITIVE';

            const severityBadgeStyle = isCritical
              ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
              : isHigh
              ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
              : isPositive
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
              : 'bg-blue-950/80 text-blue-300 border-blue-800/60';

            const icon = isCritical ? (
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            ) : isHigh ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : isPositive ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Info className="w-5 h-5 text-cyan-400" />
            );

            return (
              <div
                key={node.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? isCritical
                      ? 'bg-rose-950/20 border-rose-800/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                      : isPositive
                      ? 'bg-emerald-950/20 border-emerald-800/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-900/80 border-slate-700/80'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                {/* Node Header Bar */}
                <button
                  type="button"
                  onClick={() => toggleExpand(node.id)}
                  className="w-full p-4 flex items-center justify-between text-left space-x-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex-shrink-0">{icon}</div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          FINDING #{index + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-100 truncate">
                          {node.finding}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${severityBadgeStyle}`}
                    >
                      {node.severity}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        node.riskContribution > 0
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                      }`}
                    >
                      {node.riskContribution > 0 ? `+${node.riskContribution}` : node.riskContribution} pts
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Flowchart Breakdown Details */}
                {isExpanded && (
                  <div className="p-5 pt-0 space-y-4 border-t border-slate-800/60 mt-1">
                    {/* Source Indicator */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3">
                      <span>SOURCE: <strong className="text-cyan-300">Ingested Opportunity Submission</strong></span>
                      <span>CATEGORY: <strong className="text-slate-200">{node.category}</strong></span>
                    </div>

                    {/* Stage 1: Submitted Evidence */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                        <Quote className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold">EVIDENCE (VERBATIM EXTRACT):</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-300 italic leading-relaxed">
                        {node.evidenceQuote}
                      </div>
                    </div>

                    {/* Flow arrow */}
                    <div className="flex justify-center">
                      <ArrowDown className="w-4 h-4 text-slate-600" />
                    </div>

                    {/* Stage 2: Security Rationale & Threat Impact */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold">WHY IT MATTERS:</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        {node.whyItMatters}
                      </p>
                    </div>

                    {/* Flow arrow */}
                    <div className="flex justify-center">
                      <ArrowDown className="w-4 h-4 text-slate-600" />
                    </div>

                    {/* Stage 3: Risk Impact */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono">
                      <span className="text-slate-400">FINDING CLASSIFICATION: <strong className="text-slate-200">{node.finding}</strong></span>
                      <span className="text-slate-400">RISK CONTRIBUTION: <strong className={node.riskContribution > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{node.riskContribution > 0 ? `+${node.riskContribution}` : node.riskContribution} pts</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
