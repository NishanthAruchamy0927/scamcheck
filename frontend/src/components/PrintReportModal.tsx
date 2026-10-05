import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { InvestigationReport } from '../types/investigation';

interface PrintReportModalProps {
  report: InvestigationReport;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ report, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const categoryRisks = report.categoryRisks || {
    financial: 0,
    identity: 0,
    communication: 0,
    urgency: 0,
    credential: 0,
    organization: 0
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b0e14] border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-100 shadow-2xl relative">
        {/* Action Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800/40">
              OFFICIAL INVESTIGATION BRIEF
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="space-y-6 text-left">
          {/* Header Title */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                <h1 className="text-2xl font-extrabold font-['Outfit'] tracking-wide">
                  SCAMCHECK
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                AI Opportunity Intelligence & Threat Verification Report
              </p>
            </div>

            <div className="text-right font-mono text-xs text-slate-400">
              <div>CASE ID: <strong className="text-slate-200">{report.id}</strong></div>
              <div>DATE: {new Date(report.timestamp).toLocaleString()}</div>
            </div>
          </div>

          {/* Target Opportunity */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Opportunity Analyzed:</div>
            <div className="text-lg font-bold text-white font-['Outfit']">{report.extractedOpportunity.jobTitle}</div>
            <div className="text-xs text-slate-300 font-mono">Claimed Organization: <strong>{report.extractedOpportunity.organization}</strong> | Type: <strong>{report.extractedOpportunity.opportunityType}</strong></div>
          </div>

          {/* Risk & Confidence Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Risk Level</div>
              <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{report.riskTier}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Calibrated Score</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{report.riskScore} / 100</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Assessment Confidence</div>
              <div className="text-lg font-bold text-teal-300 font-mono mt-0.5">{report.confidenceScore}%</div>
            </div>
          </div>

          {/* Executive Assessment */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-mono font-bold uppercase text-cyan-400">
              AI Security Assessment // Executive Summary
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              {report.summary || report.executiveAssessment}
            </p>
          </div>

          {/* 6 Category Risk Dimensions */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase text-cyan-400">
              Threat Breakdown (Category Dimensions)
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div>Financial: <strong>{categoryRisks.financial}/100</strong></div>
              <div>Urgency: <strong>{categoryRisks.urgency}/100</strong></div>
              <div>Identity: <strong>{categoryRisks.identity}/100</strong></div>
              <div>Organization: <strong>{categoryRisks.organization}/100</strong></div>
              <div>Communication: <strong>{categoryRisks.communication}/100</strong></div>
              <div>Credentials: <strong>{categoryRisks.credential}/100</strong></div>
            </div>
          </div>

          {/* Opportunity Blueprint */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase text-cyan-400">
              Extracted Opportunity Metadata
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div>Organization: <strong className="text-slate-200">{report.extractedOpportunity.organization}</strong></div>
              <div>Role Profile: <strong className="text-slate-200">{report.extractedOpportunity.jobTitle}</strong></div>
              <div>Recruiter Email: <strong className="text-slate-200">{report.extractedOpportunity.recruiterEmail}</strong></div>
              <div>Financial Request: <strong className="text-rose-300">{report.extractedOpportunity.paymentAmount}</strong></div>
              <div>Platform: <strong className="text-slate-200">{report.extractedOpportunity.communicationPlatform}</strong></div>
              <div>Selection Flow: <strong className="text-slate-200">{report.extractedOpportunity.applicationMethod}</strong></div>
            </div>
          </div>

          {/* Key Findings List */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase text-cyan-400">
              Verified Evidence Findings ({report.evidenceChain.length})
            </h3>
            <div className="space-y-2">
              {report.evidenceChain.map((ev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>#{idx + 1} {ev.finding}</span>
                    <span className="font-mono text-cyan-300">{ev.riskContribution > 0 ? `+${ev.riskContribution}` : ev.riskContribution} pts</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400/90 italic">{ev.evidenceQuote}</div>
                  <div className="text-[11px] text-slate-400">{ev.whyItMatters}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Recommendation */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase text-amber-400">
              Strategic Playbook Directive: {report.recommendedAction.primaryVerdict}
            </h3>
            <p className="text-xs font-bold text-slate-200">
              {report.recommendedAction.headline}
            </p>
            <ul className="space-y-1 text-xs text-slate-300 pt-1">
              {report.recommendedAction.actionSteps.slice(0, 3).map((step, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-mono">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Limitations */}
          {report.limitations && report.limitations.length > 0 && (
            <div className="space-y-1 text-xs font-mono text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Assessment Limitations:</div>
              {report.limitations.map((lim, i) => (
                <div key={i}>• {lim}</div>
              ))}
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="text-[10px] text-slate-500 font-mono leading-relaxed pt-2 border-t border-slate-800">
            {report.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};
