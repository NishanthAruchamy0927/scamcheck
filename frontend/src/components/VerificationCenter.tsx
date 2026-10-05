import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Globe,
  ExternalLink,
  ShieldCheck,
  Building,
  Mail,
  FileCheck
} from 'lucide-react';
import { VerificationCenterData, VerificationClaimStatus } from '../types/investigation';

interface VerificationCenterProps {
  data?: VerificationCenterData;
}

export const VerificationCenter: React.FC<VerificationCenterProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'evidence' | 'diy'>('matrix');
  const [showTooltip, setShowTooltip] = useState(false);

  if (!data) return null;

  const getStatusBadge = (status: VerificationClaimStatus) => {
    switch (status) {
      case 'VERIFIED':
      case 'CONSISTENT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{status === 'VERIFIED' ? 'VERIFIED' : 'CONSISTENT'}</span>
          </span>
        );
      case 'MISMATCH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-mono font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>MISMATCH</span>
          </span>
        );
      case 'UNVERIFIED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-mono font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>UNVERIFIED</span>
          </span>
        );
      case 'UNAVAILABLE':
      case 'NOT_CHECKED':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-700 text-[11px] font-mono font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'NOT CHECKED'}</span>
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-800/70 flex items-center justify-center text-cyan-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
                EXTERNAL THREAT INTELLIGENCE
              </span>
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-slate-500 hover:text-cyan-400 transition-colors"
                title="Verification Notice"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit'] mt-0.5">
              Verification Center & Cross-Source Audit
            </h2>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="flex space-x-3 overflow-x-auto pb-2 sm:pb-0">
          {/* Trust Score */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center space-x-4 min-w-[160px]">
            <div className="text-right flex-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Trust Score
              </div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {data.trustScore || 0}/100
              </div>
            </div>
            <div className="w-10 h-10 flex-shrink-0 relative flex items-center justify-center">
              <ShieldCheck className={`w-6 h-6 ${(data.trustScore || 0) >= 50 ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
          </div>
          
          {/* Evidence Verification Meter */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center space-x-4 min-w-[180px]">
            <div className="text-right flex-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Evidence Checked
              </div>
              <div className="text-lg font-bold font-mono text-cyan-300">
                {data.evidenceVerificationPercent}%
              </div>
            </div>
            <div className="w-10 h-10 flex-shrink-0 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-cyan-400" strokeDasharray={`${data.evidenceVerificationPercent}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>
          
          {/* Verification Confidence */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center space-x-4 min-w-[160px]">
            <div className="text-right flex-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Verif. Confidence
              </div>
              <div className="text-lg font-bold font-mono text-blue-400">
                {data.verificationConfidence || '0'}%
              </div>
            </div>
            <div className="w-10 h-10 flex-shrink-0 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-blue-400" strokeDasharray={`${data.verificationConfidence || '0'}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Rationale Notice */}
      <div className="px-4 py-3 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-400 font-mono flex items-start space-x-3">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{data.trustRationale || 'Verification process completed successfully.'}</span>
      </div>

      {/* Responsible AI Tooltip Notice */}
      {showTooltip && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-300 font-mono leading-relaxed animate-fadeIn">
          <strong>Verification Notice:</strong> Verification status reflects whether submitted claims could be correlated with independent external registries. It represents available evidence, not a legal guarantee of legitimacy.
        </div>
      )}

      {/* Top 4 Quick Vector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Domain Consistency */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>Domain Match</span>
          </div>
          <div className="text-xs font-bold text-slate-200 truncate">
            {data.domainStatus === 'MATCH'
              ? '✓ CONSISTENT'
              : data.domainStatus === 'LOOKALIKE'
              ? '⚠ LOOK-ALIKE'
              : data.domainStatus === 'MISMATCH'
              ? '✗ MISMATCH'
              : '⚠ UNVERIFIED'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">{data.officialDomain}</div>
        </div>

        {/* Website Availability */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Availability</span>
          </div>
          <div className="text-xs font-bold text-slate-200">
            {data.websiteAvailability === 'REACHABLE'
              ? '✓ REACHABLE'
              : data.websiteAvailability === 'UNREACHABLE'
              ? '✗ UNREACHABLE'
              : '⚠ UNAVAILABLE'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {data.websiteAvailability === 'REACHABLE' ? 'TLS / HTTPS Verified' : 'Host unreachable'}
          </div>
        </div>

        {/* Career Listing */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1">
            <FileCheck className="w-3 h-3 text-purple-400" />
            <span>Career Listing</span>
          </div>
          <div className="text-xs font-bold text-slate-200 truncate">
            {data.opportunityExistence === 'FOUND_ON_OFFICIAL_SOURCE'
              ? '✓ FOUND ON SOURCE'
              : data.opportunityExistence === 'NOT_FOUND'
              ? '⚠ NOT LOCATED'
              : '⚠ UNINDEXED'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {data.opportunityExistence === 'FOUND_ON_OFFICIAL_SOURCE' ? 'Requisition Verified' : 'Unindexed on public ATS'}
          </div>
        </div>

        {/* Organization Registry */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1">
            <Building className="w-3 h-3 text-blue-400" />
            <span>Registry Status</span>
          </div>
          <div className="text-xs font-bold text-slate-200 truncate">
            {data.officialDomain !== 'Not indexed' ? '✓ INDEXED ENTITY' : '⚠ UNINDEXED ENTITY'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">{data.officialDomain}</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Claims Verification Matrix
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'evidence'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Submitted vs External Evidence
        </button>

        <button
          onClick={() => setActiveTab('diy')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'diy'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          "Verify This Yourself" Guide
        </button>
      </div>

      {/* Tab 1: Claims Verification Matrix (Section 12) */}
      {activeTab === 'matrix' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Claim Target</th>
                  <th className="p-3.5">Submitted Value</th>
                  <th className="p-3.5">External Benchmark</th>
                  <th className="p-3.5">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                {data.claims.map((claim, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-200 whitespace-nowrap">
                      {claim.claim}
                    </td>
                    <td className="p-3.5 text-cyan-300 font-medium">
                      {claim.submitted}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {claim.external}
                    </td>
                    <td className="p-3.5">
                      {getStatusBadge(claim.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 pt-2">
            {data.claims.map((claim, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>{claim.claim} Audit Finding:</span>
                  {getStatusBadge(claim.status)}
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{claim.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Submitted vs External Evidence (Section 10 & 11) */}
      {activeTab === 'evidence' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* User Submitted Evidence Column */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-300 font-mono font-bold text-xs">
                <Mail className="w-4 h-4" />
                <span>USER-SUBMITTED CLAIMS</span>
              </div>
              <div className="space-y-2">
                {data.externalEvidenceItems
                  .filter((e) => e.badge === 'USER_SUBMITTED')
                  .map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-xs font-mono space-y-1">
                      <div className="text-[10px] text-cyan-400 font-bold uppercase">{item.source}</div>
                      <p className="text-slate-300">{item.finding}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Independently Verified External Evidence Column */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-300 font-mono font-bold text-xs">
                <Globe className="w-4 h-4" />
                <span>INDEPENDENT EXTERNAL BENCHMARK</span>
              </div>
              <div className="space-y-2">
                {data.externalEvidenceItems
                  .filter((e) => e.badge === 'EXTERNAL_SOURCE')
                  .map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-xs font-mono space-y-1">
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">{item.source}</div>
                      <p className="text-slate-300">{item.finding}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: "Verify This Yourself" DIY Guide (Section 22) */}
      {activeTab === 'diy' && (
        <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 animate-fadeIn font-mono text-xs">
          <div className="flex items-center space-x-2 text-cyan-300 font-bold pb-2 border-b border-slate-800">
            <ExternalLink className="w-4 h-4" />
            <span>HOW TO VERIFY THIS OPPORTUNITY INDEPENDENTLY</span>
          </div>

          <ol className="space-y-2.5 pt-1 text-slate-300">
            {data.diyVerificationSteps.map((step, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
