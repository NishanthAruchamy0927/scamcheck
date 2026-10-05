import { useState } from 'react';
import { History, Search, Trash2, ArrowRight } from 'lucide-react';
import { InvestigationReport } from '../types/investigation';

interface HistoryDrawerProps {
  history: InvestigationReport[];
  onSelectInvestigation: (report: InvestigationReport) => void;
  onDeleteInvestigation: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onSelectInvestigation,
  onDeleteInvestigation,
  onClearHistory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'HIGH RISK' | 'NEEDS VERIFICATION' | 'LOW RISK'>('ALL');

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.extractedOpportunity.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.extractedOpportunity.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inputSnippet.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = tierFilter === 'ALL' || item.riskTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="max-w-5xl mx-auto my-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
              AUDIT ARCHIVE
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {history.length} Cases Stored
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            Investigation History
          </h2>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 text-xs font-semibold transition-all self-start"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Cases</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, company, role..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Tier Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setTierFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition-all ${
              tierFilter === 'ALL'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTierFilter('HIGH RISK')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              tierFilter === 'HIGH RISK'
                ? 'bg-rose-950 text-rose-200 font-bold border border-rose-800'
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
          >
            High Risk
          </button>
          <button
            onClick={() => setTierFilter('NEEDS VERIFICATION')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              tierFilter === 'NEEDS VERIFICATION'
                ? 'bg-amber-950 text-amber-200 font-bold border border-amber-800'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            Needs Verification
          </button>
          <button
            onClick={() => setTierFilter('LOW RISK')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              tierFilter === 'LOW RISK'
                ? 'bg-emerald-950 text-emerald-200 font-bold border border-emerald-800'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            Low Risk
          </button>
        </div>
      </div>

      {/* Case List */}
      {filteredHistory.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-2">
          <History className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-mono text-slate-400">
            {searchTerm || tierFilter !== 'ALL'
              ? 'No cases match the specified filters.'
              : 'No investigations recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const isHigh = item.riskTier === 'HIGH RISK';
            const isVerif = item.riskTier === 'NEEDS VERIFICATION';

            return (
              <div
                key={item.id}
                className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {item.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border uppercase ${
                        isHigh
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : isVerif
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {item.riskTier} ({item.riskScore}/100)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 truncate">
                    {item.extractedOpportunity.organization} — {item.extractedOpportunity.jobTitle}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1 font-mono">
                    {item.inputSnippet}
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onDeleteInvestigation(item.id)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                    title="Delete Case"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectInvestigation(item)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 group-hover:bg-cyan-500 group-hover:text-slate-950 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono uppercase transition-all"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
