import React, { useState } from 'react';
import {
  Printer,
  RotateCcw,
  Share2,
  Building2,
  Mail,
  DollarSign,
  Layers,
  Check,
  FileBadge,
  KeyRound,
  Clock,
  Radio,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  HelpCircle,
  GitCompare,
  History,
  Shield,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  Activity
} from 'lucide-react';
import { InvestigationReport } from '../types/investigation';
import { EvidenceChain } from './EvidenceChain';
import { OrgConsistencyMatrix } from './OrgConsistencyMatrix';
import { PotentialExposureView } from './PotentialExposure';
import { ActionRecommendations } from './ActionRecommendations';
import { UncertaintyBanner } from './UncertaintyBanner';
import { PrintReportModal } from './PrintReportModal';

// Prompt 5 Differentiation Layer Components
import { OpportunityDnaCard } from './OpportunityDnaCard';
import { TrustProfileView } from './TrustProfileView';
import { ContradictionsCard } from './ContradictionsCard';
import { WhatIfSimulator } from './WhatIfSimulator';
import { LegitimacyCheckView } from './LegitimacyCheckView';
import { ScoreWaterfallView } from './ScoreWaterfallView';
import { MultimodalEvidenceView } from './MultimodalEvidenceView';
import { PaymentSecurityPanel } from './PaymentSecurityPanel';
import { CompanyCredibilityPanel } from './CompanyCredibilityPanel';

// Prompt 6 External Threat Intelligence & Verification Center
import { VerificationCenter } from './VerificationCenter';

interface InvestigationReportProps {
  report: InvestigationReport;
  onReset: () => void;
  onOpenHistory?: () => void;
  onOpenCompare?: () => void;
}

export const InvestigationReportView: React.FC<InvestigationReportProps> = ({
  report,
  onReset,
  onOpenHistory,
  onOpenCompare
}) => {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAllFindings, setShowAllFindings] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showLimitations, setShowLimitations] = useState(false);
  const [showConfidenceTooltip, setShowConfidenceTooltip] = useState(false);

  const isHighRisk = report.riskTier === 'HIGH RISK';
  const isNeedsVerif = report.riskTier === 'NEEDS VERIFICATION';

  const riskBadgeStyle = isHighRisk
    ? 'bg-rose-950 text-rose-300 border-rose-600 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
    : isNeedsVerif
    ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
    : 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.35)]';

  const riskGaugeColor = isHighRisk
    ? '#ef4444'
    : isNeedsVerif
    ? '#f59e0b'
    : '#10b981';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const entities = report.extractedOpportunity;
  const categoryRisks = report.categoryRisks || {
    financial: 0,
    identity: 0,
    communication: 0,
    urgency: 0,
    credential: 0,
    organization: 0
  };

  // Dimension color styling
  const getDimensionColor = (score: number) => {
    if (score >= 60) return { bar: 'bg-rose-500 shadow-[0_0_10px_#ef4444]', text: 'text-rose-400', badge: 'bg-rose-950/80 text-rose-300 border-rose-800' };
    if (score >= 30) return { bar: 'bg-amber-500 shadow-[0_0_10px_#f59e0b]', text: 'text-amber-400', badge: 'bg-amber-950/80 text-amber-300 border-amber-800' };
    return { bar: 'bg-emerald-500 shadow-[0_0_10px_#10b981]', text: 'text-emerald-400', badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' };
  };

  // Critical findings (top signals)
  const criticalSignals = report.signals.filter((s) => s.severity === 'CRITICAL' || s.severity === 'HIGH');
  const visibleFindings = showAllFindings ? report.signals : report.signals.slice(0, 3);

  // Financial request details
  const hasPayment = entities.paymentRequested || entities.paymentAmount !== 'Not detected';
  const hasDomainMismatch = report.orgConsistency.recruiterDomainStatus === 'PUBLIC_FREE_EMAIL' || report.orgConsistency.recruiterDomainStatus === 'DOMAIN_MISMATCH';
  const hasUrgency = entities.deadlines !== 'Not detected';

  return (
    <div className="max-w-5xl mx-auto my-8 space-y-8 animate-fadeIn">
      {/* 1. PRIMARY COMMAND CENTER HEADER & RISK ASSESSMENT (Sections 1, 2, 3) */}
      <div className={`glass-panel p-6 sm:p-8 rounded-3xl border ${isHighRisk ? 'glow-red' : isNeedsVerif ? 'glow-amber' : 'glow-green'} relative overflow-hidden space-y-6`}>
        {/* Ambient Glow Orb */}
        <div
          className="absolute -top-12 -right-12 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: riskGaugeColor }}
        />

        {/* Top Case Identity Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold tracking-widest px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400">
              AUDIT CASE ID: {report.id}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date(report.timestamp).toLocaleString()}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
              SOURCE: {report.inputMode.toUpperCase()}
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
              title="Export Official PDF Brief"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>

            {onOpenCompare && (
              <button
                onClick={onOpenCompare}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
                title="Compare with another opportunity"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>
            )}

            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
                title="View Case History"
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-bold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Analyze Another</span>
            </button>
          </div>
        </div>

        {/* Opportunity Subject Title Strip */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
              TARGET OF INVESTIGATION
            </span>
            <span className="text-xs font-mono text-slate-400">
              {entities.opportunityType}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            {entities.jobTitle}
          </h1>
          <p className="text-sm font-semibold text-slate-300">
            Claimed Organization: <span className="text-cyan-300">{entities.organization}</span>
          </p>
        </div>

        {/* Main Risk & Confidence Dominant Visualizer (Sections 1 & 2) */}
        <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Dominant Risk Score Gauge */}
          <div className="flex items-center space-x-5 md:col-span-2">
            {/* SVG Circular Radial Progress Gauge */}
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#1e293b"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={riskGaugeColor}
                  strokeWidth="10"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 - (263.89 * report.riskScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold font-mono text-white tracking-tighter">
                  {report.riskScore}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  / 100 RISK
                </span>
              </div>
            </div>

            {/* Risk Tier & Primary Verdict */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3.5 py-1 rounded-xl text-xs font-mono font-extrabold tracking-wider border uppercase ${riskBadgeStyle}`}
                >
                  {report.riskTier}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300">
                  ACTION: {report.recommendedAction.primaryVerdict === 'STOP' ? 'DO NOT PAY / CEASE CONTACT' : report.recommendedAction.primaryVerdict === 'VERIFY' ? 'VERIFY INDEPENDENTLY' : 'PROCEED WITH CAUTION'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white font-['Outfit']">
                {isHighRisk
                  ? 'High Risk of Fraudulent Exploitation'
                  : isNeedsVerif
                  ? 'Caution: Unverified Attributes Require Cross-Check'
                  : 'Authentic Opportunity Profile'}
              </h2>
              <div className="text-xs text-slate-300 font-mono flex flex-wrap items-center gap-2">
                <span className="text-slate-400">Primary Driver:</span>
                <span className="font-bold text-cyan-300">
                  {criticalSignals.length > 0
                    ? criticalSignals[0].name
                    : report.signals.length > 0
                    ? report.signals[0].name
                    : 'Standard enterprise recruitment workflow'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Assessment Confidence Card (Section 3) */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 relative">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <span className="uppercase tracking-wider">ASSESSMENT CONFIDENCE</span>
                <button
                  type="button"
                  onClick={() => setShowConfidenceTooltip(!showConfidenceTooltip)}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                  title="Confidence Explanation"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="font-bold text-cyan-300 text-sm">{report.confidenceScore}%</span>
            </div>

            {/* Confidence Tooltip note */}
            {showConfidenceTooltip && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-800/60 text-[11px] text-cyan-300 font-mono leading-relaxed">
                Confidence reflects the strength and completeness of available evidence. It is separate from risk.
              </div>
            )}

            {/* Confidence Bar */}
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${report.confidenceScore}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {report.confidenceRationale}
            </p>
          </div>
        </div>

        {/* 4. EXECUTIVE AI ASSESSMENT (Section 4) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
            <FileBadge className="w-4 h-4" />
            <span>AI SECURITY ASSESSMENT // EXECUTIVE SUMMARY</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {report.summary || report.executiveAssessment}
          </p>
        </div>
      </div>

      {/* PHASE 4: MACHINE LEARNING ENGINE FUSION */}
      {report.machineLearning && report.machineLearning.available && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-800/40 space-y-6 relative overflow-hidden bg-slate-900/40">
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-cyan-900/20 blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-950/50 rounded-xl border border-cyan-800/50">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                  Machine Learning Engine
                </h3>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  {report.machineLearning.model} v{report.machineLearning.version}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-950/30 border border-emerald-800/30 rounded-full">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Engine Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">
                Scam Probability Score
              </div>
              <div className="flex items-end space-x-3">
                <span className={`text-4xl font-extrabold font-mono ${
                  (report.machineLearning.score || 0) >= 60 ? 'text-rose-400' : (report.machineLearning.score || 0) >= 30 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {report.machineLearning.score}%
                </span>
                <span className="text-xs font-mono text-slate-500 pb-1">likelihood</span>
              </div>
              <div className="mt-4 w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    (report.machineLearning.score || 0) >= 60 ? 'bg-rose-500' : (report.machineLearning.score || 0) >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} 
                  style={{ width: `${report.machineLearning.score}%` }} 
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">
                Model Confidence Calibration
              </div>
              <div className="flex items-end space-x-3">
                <span className="text-4xl font-extrabold font-mono text-cyan-300">
                  {report.machineLearning.confidence}%
                </span>
                <span className="text-xs font-mono text-slate-500 pb-1">calibrated</span>
              </div>
              <div className="mt-4 w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-1000" 
                  style={{ width: `${report.machineLearning.confidence}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
            <span className="text-cyan-400 font-bold mr-2">FUSION NOTE:</span>
            This AI prediction is one evidence source. The final system assessment ({report.riskScore}/100) merges this ML signal with {report.signals.length} deterministic security rules to prevent false positives and maintain explainability.
          </div>
        </div>
      )}

      {/* PHASE 5: MULTIMODAL INTELLIGENCE PIPELINE */}
      {report.multimodal && (
        <MultimodalEvidenceView multimodal={report.multimodal} />
      )}

      {/* PHASE 9: PAYMENT SECURITY INTELLIGENCE */}
      <PaymentSecurityPanel multimodalContext={report.multimodal} />

      {/* COMPANY CREDIBILITY (LINKEDIN) & CAREER VALUE FOR STUDENTS */}
      {report.companyCredibility && (
        <CompanyCredibilityPanel report={report.companyCredibility} />
      )}

      {/* PROMPT 5 FEATURE: OPPORTUNITY DNA & FINGERPRINT */}
      <OpportunityDnaCard dna={report.opportunityDna} />

      {/* PROMPT 5 FEATURE: CONTRADICTIONS ENGINE (IF CONTRADICTIONS DETECTED) */}
      <ContradictionsCard contradictions={report.contradictions} />

      {/* PROMPT 5 FEATURE: OPPORTUNITY TRUST PROFILE */}
      <TrustProfileView profile={report.trustProfile} />

      {/* PROMPT 6 FEATURE: EXTERNAL THREAT INTELLIGENCE & VERIFICATION CENTER */}
      <VerificationCenter data={report.verificationCenter} />

      {/* 5. RISK BREAKDOWN — 6 INTERACTIVE CATEGORY DIMENSIONS (Section 5) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase">
              THREAT DIMENSIONS
            </span>
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Risk Breakdown by Threat Vector
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Click any vector to inspect signals
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. Financial */}
          <div
            onClick={() => setExpandedCategory(expandedCategory === 'FINANCIAL' ? null : 'FINANCIAL')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              expandedCategory === 'FINANCIAL'
                ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Financial Risk</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDimensionColor(categoryRisks.financial).badge}`}>
                {categoryRisks.financial}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-1.5">
              <div className={`h-full ${getDimensionColor(categoryRisks.financial).bar} transition-all duration-500`} style={{ width: `${categoryRisks.financial}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">{categoryRisks.financial > 50 ? 'Advance fee / deposit threat' : 'No financial liability'}</span>
              {expandedCategory === 'FINANCIAL' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* 2. Urgency */}
          <div
            onClick={() => setExpandedCategory(expandedCategory === 'URGENCY' ? null : 'URGENCY')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              expandedCategory === 'URGENCY'
                ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <Clock className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold">Urgency Risk</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDimensionColor(categoryRisks.urgency).badge}`}>
                {categoryRisks.urgency}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-1.5">
              <div className={`h-full ${getDimensionColor(categoryRisks.urgency).bar} transition-all duration-500`} style={{ width: `${categoryRisks.urgency}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">{categoryRisks.urgency > 40 ? '24h deadline / FOMO manipulation' : 'Standard deliberation time'}</span>
              {expandedCategory === 'URGENCY' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* 3. Identity */}
          <div
            onClick={() => setExpandedCategory(expandedCategory === 'IDENTITY' ? null : 'IDENTITY')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              expandedCategory === 'IDENTITY'
                ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <FileBadge className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Identity Risk</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDimensionColor(categoryRisks.identity).badge}`}>
                {categoryRisks.identity}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-1.5">
              <div className={`h-full ${getDimensionColor(categoryRisks.identity).bar} transition-all duration-500`} style={{ width: `${categoryRisks.identity}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">{categoryRisks.identity > 40 ? 'Premature national ID harvesting' : 'Normal identity requirements'}</span>
              {expandedCategory === 'IDENTITY' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* 4. Organization */}
          <div
            onClick={() => setExpandedCategory(expandedCategory === 'ORGANIZATION' ? null : 'ORGANIZATION')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              expandedCategory === 'ORGANIZATION'
                ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">Organization Risk</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDimensionColor(categoryRisks.organization).badge}`}>
                {categoryRisks.organization}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-1.5">
              <div className={`h-full ${getDimensionColor(categoryRisks.organization).bar} transition-all duration-500`} style={{ width: `${categoryRisks.organization}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">{categoryRisks.organization > 40 ? 'Domain mismatch / impersonation' : 'Verified entity alignment'}</span>
              {expandedCategory === 'ORGANIZATION' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* 5. Communication */}
          <div
            onClick={() => setExpandedCategory(expandedCategory === 'COMMUNICATION' ? null : 'COMMUNICATION')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              expandedCategory === 'COMMUNICATION'
                ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <Radio className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold">Communication Risk</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDimensionColor(categoryRisks.communication).badge}`}>
                {categoryRisks.communication}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-1.5">
              <div className={`h-full ${getDimensionColor(categoryRisks.communication).bar} transition-all duration-500`} style={{ width: `${categoryRisks.communication}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">{categoryRisks.communication > 40 ? 'Public webmail / Telegram routing' : 'Official domain channel'}</span>
              {expandedCategory === 'COMMUNICATION' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* 6. Credentials */}
          <div
            onClick={() => setExpandedCategory(expandedCategory === 'CREDENTIAL' ? null : 'CREDENTIAL')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              expandedCategory === 'CREDENTIAL'
                ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <KeyRound className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold">Credential Risk</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDimensionColor(categoryRisks.credential).badge}`}>
                {categoryRisks.credential}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-1.5">
              <div className={`h-full ${getDimensionColor(categoryRisks.credential).bar} transition-all duration-500`} style={{ width: `${categoryRisks.credential}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">{categoryRisks.credential > 0 ? 'OTP / password / PIN theft threat' : 'Zero credential solicitation'}</span>
              {expandedCategory === 'CREDENTIAL' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* Expanded Category Signal Drilldown */}
        {expandedCategory && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 pb-2 border-b border-slate-850">
              <span>SIGNALS IN {expandedCategory} CATEGORY:</span>
              <button
                onClick={() => setExpandedCategory(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                Close Drilldown
              </button>
            </div>
            {report.signals.filter((s) => s.category === expandedCategory).length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-2">
                No active threat signals triggered in this category.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {report.signals.filter((s) => s.category === expandedCategory).map((sig) => (
                  <div key={sig.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{sig.name}</span>
                      <span className="font-mono text-rose-400">{sig.riskContribution > 0 ? `+${sig.riskContribution}` : sig.riskContribution} pts</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{sig.whyItMatters}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROMPT 5 FEATURE: WHAT DRIVES THE SCORE & ARCHITECTURE TRANSPARENCY */}
      <ScoreWaterfallView drivers={report.scoreDrivers} finalScore={report.riskScore} />

      {/* PROMPT 5 FEATURE: WHAT-IF RISK SIMULATOR */}
      <WhatIfSimulator
        initialScore={report.riskScore}
        hasPayment={hasPayment}
        hasDomainMismatch={hasDomainMismatch}
        hasUrgency={hasUrgency}
      />

      {/* 6. CRITICAL FINDINGS (Section 6) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Critical Findings ({report.signals.length})
            </h3>
          </div>
          {report.signals.length > 3 && (
            <button
              onClick={() => setShowAllFindings(!showAllFindings)}
              className="text-xs font-mono text-cyan-400 hover:underline"
            >
              {showAllFindings ? 'Show Top Findings' : `View All (${report.signals.length})`}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {visibleFindings.map((finding, idx) => {
            const isCritical = finding.severity === 'CRITICAL';
            const isHigh = finding.severity === 'HIGH';
            const isPositive = finding.severity === 'POSITIVE';

            return (
              <div
                key={finding.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-xs text-slate-500">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-bold text-slate-100 truncate">
                      {finding.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        isCritical
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : isHigh
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : isPositive
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-blue-950 text-blue-300 border-blue-800'
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-cyan-300/90 italic pl-6 line-clamp-2">
                    {finding.evidence}
                  </p>
                  <p className="text-xs text-slate-400 pl-6">
                    {finding.whyItMatters}
                  </p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                      finding.riskContribution > 0
                        ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                    }`}
                  >
                    {finding.riskContribution > 0 ? `+${finding.riskContribution}` : finding.riskContribution} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7 & 8. EXPLAINABLE EVIDENCE CHAIN & SOURCE HIGHLIGHTING (Sections 7 & 8) */}
      <EvidenceChain evidenceChain={report.evidenceChain} rawSnippet={report.inputSnippet} />

      {/* PROMPT 5 FEATURE: LEGITIMACY CHECK, MANIPULATION SIGNALS & FALSE POSITIVE AWARENESS */}
      <LegitimacyCheckView
        legitimacy={report.legitimacyCheck}
        manipulation={report.manipulationSignals}
        falsePositives={report.falsePositiveContext}
      />

      {/* 9. OPPORTUNITY INTELLIGENCE BLUEPRINT (Section 9) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
              STRUCTURED EXTRACTION
            </span>
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Opportunity Intelligence Blueprint
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Source: {report.inputMode.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {/* Organization */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-cyan-400" />
              <span>Organization</span>
            </div>
            <div className={`font-semibold mt-1 truncate ${entities.organization === 'Not detected' ? 'text-slate-500 italic' : 'text-slate-200'}`}>
              {entities.organization === 'Not detected' ? 'NOT DETECTED' : entities.organization}
            </div>
          </div>

          {/* Recruiter */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Recruiter Name</div>
            <div className={`font-semibold mt-1 truncate ${entities.recruiter === 'Not detected' ? 'text-slate-500 italic' : 'text-slate-200'}`}>
              {entities.recruiter === 'Not detected' ? 'NOT DETECTED' : entities.recruiter}
            </div>
          </div>

          {/* Recruiter Email */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1">
              <Mail className="w-3 h-3 text-purple-400" />
              <span>Recruiter Email</span>
            </div>
            <div className={`font-semibold mt-1 truncate font-mono text-[11px] ${entities.recruiterEmail === 'Not detected' ? 'text-slate-500 italic' : 'text-slate-200'}`}>
              {entities.recruiterEmail === 'Not detected' ? 'NOT DETECTED' : entities.recruiterEmail}
            </div>
          </div>

          {/* Phone */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Phone Number</div>
            <div className={`font-semibold mt-1 truncate font-mono text-[11px] ${entities.phoneNumber === 'Not detected' ? 'text-slate-500 italic' : 'text-slate-200'}`}>
              {entities.phoneNumber === 'Not detected' ? 'NOT DETECTED' : entities.phoneNumber}
            </div>
          </div>

          {/* Website */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Website / Domain</div>
            <div className={`font-semibold mt-1 truncate font-mono text-[11px] ${entities.website === 'Not detected' ? 'text-slate-500 italic' : 'text-cyan-300'}`}>
              {entities.website === 'Not detected' ? 'NOT DETECTED' : entities.website}
            </div>
          </div>

          {/* Role */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1">
              <Layers className="w-3 h-3 text-blue-400" />
              <span>Role / Profile</span>
            </div>
            <div className="font-semibold text-slate-200 mt-1 truncate">
              {entities.jobTitle}
            </div>
          </div>

          {/* Type */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Opportunity Type</div>
            <div className="font-semibold text-slate-200 mt-1 truncate">
              {entities.opportunityType}
            </div>
          </div>

          {/* Location */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Location / Work Mode</div>
            <div className="font-semibold text-slate-200 mt-1 truncate">
              {entities.location}
            </div>
          </div>

          {/* Compensation */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span>Compensation</span>
            </div>
            <div className="font-semibold text-slate-200 mt-1 truncate">
              {entities.salaryStipend === 'Not detected' ? 'NOT DETECTED' : entities.salaryStipend}
            </div>
          </div>

          {/* Upfront Payment */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Upfront Fee Demand</div>
            <div className={`font-semibold mt-1 truncate ${hasPayment ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
              {entities.paymentAmount === 'Not detected' ? (hasPayment ? 'Fee Detected' : 'NOT DETECTED') : entities.paymentAmount}
            </div>
          </div>

          {/* Deadline */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Deadline / Urgency</div>
            <div className="font-semibold text-slate-200 mt-1 truncate font-mono text-[11px]">
              {entities.deadlines === 'Not detected' ? 'NOT DETECTED' : entities.deadlines}
            </div>
          </div>

          {/* Channel */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Contact Channel</div>
            <div className="font-semibold text-slate-200 mt-1 truncate">
              {entities.communicationPlatform}
            </div>
          </div>
        </div>
      </div>

      {/* 10. ORGANIZATION CONSISTENCY & CONTACT ANALYSIS (Section 10 & 11) */}
      <OrgConsistencyMatrix consistency={report.orgConsistency} />

      {/* 12. DEDICATED FINANCIAL RISK CARD (Section 12) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Financial Risk Assessment
            </h3>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase ${
              hasPayment
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}
          >
            {hasPayment ? 'CRITICAL FINANCIAL THREAT' : 'NO PAYMENT DETECTED'}
          </span>
        </div>

        {hasPayment ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Demanded Amount</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">{entities.paymentAmount}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Claimed Purpose</div>
              <div className="text-slate-200 font-semibold mt-0.5">{entities.paymentReason || 'Registration fee'}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Payment Timing</div>
              <div className="text-rose-300 font-semibold mt-0.5">Before onboarding / start</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Threat Severity</div>
              <div className="text-rose-400 font-bold mt-0.5">CRITICAL</div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs font-mono text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>No upfront fee, registration charge, or hardware deposit demanded from candidate.</span>
          </div>
        )}
      </div>

      {/* 13. POTENTIAL EXPOSURE (Section 13) */}
      <PotentialExposureView exposure={report.potentialExposure} />

      {/* 14. RECOMMENDED ACTION ("WHAT SHOULD YOU DO?") (Section 14) */}
      <ActionRecommendations action={report.recommendedAction} />

      {/* PROMPT 5 FEATURE: FINAL DECISION CARD (Section 22) */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${isHighRisk ? 'bg-rose-950/30 border-rose-800' : isNeedsVerif ? 'bg-amber-950/30 border-amber-800' : 'bg-emerald-950/30 border-emerald-800'} space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <ShieldAlert className={`w-5 h-5 ${isHighRisk ? 'text-rose-400' : isNeedsVerif ? 'text-amber-400' : 'text-emerald-400'}`} />
            <h3 className="text-lg font-extrabold text-white font-['Outfit']">
              SCAMCHECK VERDICT & EXECUTIVE DIRECTIVE
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-300">
            Confidence: <strong className="text-cyan-300">{report.confidenceScore}%</strong>
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-bold text-white font-['Outfit']">
            {report.recommendedAction.headline}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {report.summary}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={() => {
              const evEl = document.getElementById('evidence-chain-station');
              if (evEl) evEl.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold hover:bg-slate-800 transition-all"
          >
            <span>View Full Evidence Chain</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Analyze Another Opportunity</span>
          </button>
        </div>
      </div>

      {/* 15. INVESTIGATION TIMELINE (Section 15) */}
      {report.investigationSteps && report.investigationSteps.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Investigation Audit Trail
            </h3>
          </div>
          <div className="space-y-2.5">
            {report.investigationSteps.map((step) => (
              <div
                key={step.step}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono"
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200 font-bold">{step.step}. {step.name}</span>
                </div>
                <span className="text-slate-400 truncate max-w-sm">{step.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 16. ASSESSMENT LIMITATIONS (Section 16) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
        <button
          type="button"
          onClick={() => setShowLimitations(!showLimitations)}
          className="w-full flex items-center justify-between text-left text-xs font-mono text-slate-400 hover:text-slate-200"
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">ASSESSMENT LIMITATIONS & UNCERTAINTY BOUNDS</span>
          </div>
          {showLimitations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLimitations && (
          <div className="pt-2 space-y-2 text-xs font-mono text-slate-400 border-t border-slate-800/80 animate-fadeIn">
            {report.limitations.map((lim, i) => (
              <div key={i} className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{lim}</span>
              </div>
            ))}
            <p className="text-[11px] text-slate-500 pt-1">
              ScamCheck assessments rely on submitted text, document attachments, and authenticated domain registries. Independent verification is always recommended.
            </p>
          </div>
        )}
      </div>

      {/* Uncertainty Refusal Gate Banner (if applicable) */}
      <UncertaintyBanner uncertainty={report.uncertainty} />

      {/* 17. RESPONSIBLE AI NOTICE (Section 17) */}
      <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-900 text-center text-[11px] text-slate-500 font-mono leading-relaxed">
        <strong>Responsible AI Notice:</strong> {report.disclaimer}
      </div>

      {/* Print / Export Report Modal (Section 19) */}
      {showPrintModal && (
        <PrintReportModal report={report} onClose={() => setShowPrintModal(false)} />
      )}
    </div>
  );
};
