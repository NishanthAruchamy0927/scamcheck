import { useState } from 'react';
import {
  GitCompare,
  Sparkles
} from 'lucide-react';
import { ComparisonReport, DemoCase } from '../types/investigation';
import { compareOpportunities } from '../services/api';

interface ComparisonWorkspaceProps {
  demos: DemoCase[];
}

export const ComparisonWorkspace: React.FC<ComparisonWorkspaceProps> = ({ demos }) => {
  const [textA, setTextA] = useState(demos[0]?.content || '');
  const [textB, setTextB] = useState(demos[1]?.content || '');
  const [comparisonReport, setComparisonReport] = useState<ComparisonReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunComparison = async () => {
    if (!textA.trim() || !textB.trim()) {
      setError('Please provide text for both Opportunity A and Opportunity B.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await compareOpportunities(textA, textB);
      setComparisonReport(res);
    } catch (err: any) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreset = (demoA: DemoCase, demoB: DemoCase) => {
    setTextA(demoA.content);
    setTextB(demoB.content);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto my-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 text-xs font-mono">
          <GitCompare className="w-3.5 h-3.5" />
          <span>DUAL-PANE OPPORTUNITY WORKSPACE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
          Compare Opportunities
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Evaluate two distinct job offers, internships, or scholarship proposals side-by-side to expose hidden threat differentials.
        </p>

        {/* Quick Presets */}
        {demos.length >= 2 && (
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">Quick Presets:</span>
            <button
              onClick={() => handleLoadPreset(demos[0], demos[1])}
              className="text-xs px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 transition-all font-medium"
            >
              ⚡ Fake TCS Internship vs Verified Google Offer
            </button>
            {demos.length >= 4 && (
              <button
                onClick={() => handleLoadPreset(demos[2], demos[3])}
                className="text-xs px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 transition-all font-medium"
              >
                ⚡ Ambiguous Startup vs Academic Grant Scam
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input Panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pane A */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
              OPPORTUNITY A
            </span>
            <span className="text-[11px] font-mono text-slate-500">{textA.length} chars</span>
          </div>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            rows={8}
            placeholder="Paste text for Opportunity A..."
            className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all resize-y"
          />
        </div>

        {/* Pane B */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/40">
              OPPORTUNITY B
            </span>
            <span className="text-[11px] font-mono text-slate-500">{textB.length} chars</span>
          </div>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            rows={8}
            placeholder="Paste text for Opportunity B..."
            className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all resize-y"
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs text-center">
          {error}
        </div>
      )}

      {/* Compare Action Button */}
      <div className="text-center">
        <button
          onClick={handleRunComparison}
          disabled={isLoading}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] disabled:opacity-50"
        >
          {isLoading ? 'ANALYZING THREAT DIFFERENTIAL...' : 'EXECUTE COMPARATIVE ANALYSIS'}
        </button>
      </div>

      {/* Comparative Results View */}
      {comparisonReport && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/80 space-y-8 animate-fadeIn">
          {/* Strategic Delta Summary Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Comparative Verdict & Strategic Recommendation</span>
            </div>
            <p className="text-sm font-bold text-white font-['Outfit'] leading-relaxed">
              {comparisonReport.deltaSummary.recommendation}
            </p>
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400">Key Identified Differentials:</span>
              <ul className="space-y-1">
                {comparisonReport.deltaSummary.keyDifferences.map((diff, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                    <span className="text-cyan-400 font-bold font-mono">→</span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Side-by-Side Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column A */}
            <div className={`p-5 rounded-2xl border ${comparisonReport.itemA.riskTier === 'HIGH RISK' ? 'bg-rose-950/20 border-rose-800/60' : comparisonReport.itemA.riskTier === 'LOW RISK' ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-amber-950/20 border-amber-800/60'} space-y-4`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono text-xs font-bold text-cyan-400">
                  OPPORTUNITY A
                </span>
                <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded bg-black/60 border border-white/10">
                  {comparisonReport.itemA.riskTier} ({comparisonReport.itemA.riskScore}/100)
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Organization:</span>
                  <span className="font-bold text-slate-100">{comparisonReport.itemA.extractedOpportunity.organization}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Recruiter:</span>
                  <span className="text-slate-100">{comparisonReport.itemA.extractedOpportunity.recruiterEmail}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Upfront Payment:</span>
                  <span className={comparisonReport.itemA.extractedOpportunity.paymentAmount !== 'Not detected' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {comparisonReport.itemA.extractedOpportunity.paymentAmount}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Recruitment Flow:</span>
                  <span className="text-slate-100">{comparisonReport.itemA.orgConsistency.recruitmentWorkflowStatus.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Confidence:</span>
                  <span className="text-cyan-300 font-bold">{comparisonReport.itemA.confidenceScore}%</span>
                </div>
              </div>
            </div>

            {/* Column B */}
            <div className={`p-5 rounded-2xl border ${comparisonReport.itemB.riskTier === 'HIGH RISK' ? 'bg-rose-950/20 border-rose-800/60' : comparisonReport.itemB.riskTier === 'LOW RISK' ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-amber-950/20 border-amber-800/60'} space-y-4`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono text-xs font-bold text-blue-400">
                  OPPORTUNITY B
                </span>
                <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded bg-black/60 border border-white/10">
                  {comparisonReport.itemB.riskTier} ({comparisonReport.itemB.riskScore}/100)
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Organization:</span>
                  <span className="font-bold text-slate-100">{comparisonReport.itemB.extractedOpportunity.organization}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Recruiter:</span>
                  <span className="text-slate-100">{comparisonReport.itemB.extractedOpportunity.recruiterEmail}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Upfront Payment:</span>
                  <span className={comparisonReport.itemB.extractedOpportunity.paymentAmount !== 'Not detected' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {comparisonReport.itemB.extractedOpportunity.paymentAmount}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Recruitment Flow:</span>
                  <span className="text-slate-100">{comparisonReport.itemB.orgConsistency.recruitmentWorkflowStatus.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Confidence:</span>
                  <span className="text-cyan-300 font-bold">{comparisonReport.itemB.confidenceScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
