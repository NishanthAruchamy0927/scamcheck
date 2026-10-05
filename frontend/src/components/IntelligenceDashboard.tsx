import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { InvestigationReport } from '../types/investigation';

interface IntelligenceDashboardProps {
  history: InvestigationReport[];
  onSelectInvestigation: (report: InvestigationReport) => void;
  onClearHistory: () => void;
}

export const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({
  history,
  onSelectInvestigation,
  onClearHistory
}) => {
  const total = history.length;
  const highRiskCount = history.filter((h) => h.riskTier === 'HIGH RISK').length;
  const needsVerifCount = history.filter((h) => h.riskTier === 'NEEDS VERIFICATION').length;
  const lowRiskCount = history.filter((h) => h.riskTier === 'LOW RISK').length;

  const highPct = total > 0 ? Math.round((highRiskCount / total) * 100) : 0;
  const needsVerifPct = total > 0 ? Math.round((needsVerifCount / total) * 100) : 0;
  const lowPct = total > 0 ? Math.round((lowRiskCount / total) * 100) : 0;

  // Aggregate Top Detected Threat Patterns across history
  const signalFrequency: { [name: string]: number } = {};
  history.forEach((h) => {
    h.signals.forEach((s) => {
      if (s.severity === 'CRITICAL' || s.severity === 'HIGH') {
        signalFrequency[s.name] = (signalFrequency[s.name] || 0) + 1;
      }
    });
  });

  const sortedThreats = Object.entries(signalFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto my-8 space-y-8 animate-fadeIn">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
              TELEMETRY & AUDIT INTELLIGENCE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            Opportunity Threat Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time analytics aggregated across all historical opportunity audits.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 text-xs font-semibold transition-all self-start"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* 4 Core Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Investigations */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Total Audits</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {total}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Completed opportunity investigations</p>
        </div>

        {/* High Risk Count */}
        <div className="glass-panel p-5 rounded-3xl border border-rose-950/60 space-y-2">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-mono uppercase">High Risk Scams</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-rose-400">
            {highRiskCount}
          </div>
          <p className="text-[11px] text-rose-400/70 font-mono">{highPct}% of total audits</p>
        </div>

        {/* Needs Verification Count */}
        <div className="glass-panel p-5 rounded-3xl border border-amber-950/60 space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-mono uppercase">Needs Verification</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400">
            {needsVerifCount}
          </div>
          <p className="text-[11px] text-amber-400/70 font-mono">{needsVerifPct}% of total audits</p>
        </div>

        {/* Low Risk Count */}
        <div className="glass-panel p-5 rounded-3xl border border-emerald-950/60 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-mono uppercase">Verified Safe</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">
            {lowRiskCount}
          </div>
          <p className="text-[11px] text-emerald-400/70 font-mono">{lowPct}% of total audits</p>
        </div>
      </div>

      {/* Risk Distribution & Top Threat Signatures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Distribution Meter */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              Risk Profile Distribution
            </span>
            <span className="text-[11px] font-mono text-slate-500">{total} Cases</span>
          </div>

          {/* Tri-color Stacked Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${highPct}%` }}
                title={`High Risk: ${highPct}%`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${needsVerifPct}%` }}
                title={`Needs Verification: ${needsVerifPct}%`}
              />
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${lowPct}%` }}
                title={`Low Risk: ${lowPct}%`}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <div className="flex items-center space-x-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>High: {highPct}%</span>
              </div>
              <div className="flex items-center space-x-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Verify: {needsVerifPct}%</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Safe: {lowPct}%</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-2">
            Distribution reflects user-submitted opportunity triage results calibrated against threat severity thresholds.
          </p>
        </div>

        {/* Top Detected Scam Signatures */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              Top Detected Threat Patterns
            </span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>

          {sortedThreats.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 font-mono">
              Run investigations to build telemetry dataset.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedThreats.map(([threatName, count], idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono"
                >
                  <span className="text-slate-300 truncate max-w-[280px]">
                    #{idx + 1} {threatName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40 font-bold">
                    {count} {count === 1 ? 'hit' : 'hits'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Investigations Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-mono font-bold uppercase text-slate-300">
            Recent Audit Case Log
          </span>
          <span className="text-xs text-slate-500 font-mono">Click to inspect</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            No past investigations recorded. Start an audit to generate cases.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-mono border-b border-slate-800/80">
                  <th className="pb-3 pl-2">Case ID</th>
                  <th className="pb-3">Organization</th>
                  <th className="pb-3">Role / Subject</th>
                  <th className="pb-3">Risk Tier</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {history.slice(0, 10).map((item) => {
                  const isHigh = item.riskTier === 'HIGH RISK';
                  const isVerif = item.riskTier === 'NEEDS VERIFICATION';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectInvestigation(item)}
                      className="hover:bg-slate-900/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 pl-2 text-cyan-400 font-bold">{item.id}</td>
                      <td className="py-3 text-slate-200 font-sans font-semibold">
                        {item.extractedOpportunity.organization}
                      </td>
                      <td className="py-3 text-slate-400 truncate max-w-[200px]">
                        {item.extractedOpportunity.jobTitle}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                            isHigh
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : isVerif
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {item.riskTier}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-100">{item.riskScore}/100</td>
                      <td className="py-3 text-cyan-300">{item.confidenceScore}%</td>
                      <td className="py-3 pr-2 text-right">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-300 text-[10px] font-bold transition-all"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
