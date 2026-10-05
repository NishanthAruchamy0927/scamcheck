import React from 'react';
import {
  Building2,
  Globe,
  Mail,
  MessageSquare,
  Workflow,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { OrgConsistencyVector } from '../types/investigation';

interface OrgConsistencyMatrixProps {
  consistency: OrgConsistencyVector;
}

export const OrgConsistencyMatrix: React.FC<OrgConsistencyMatrixProps> = ({ consistency }) => {
  const getStatusBadge = (status: string, label: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'MATCHED':
      case 'OFFICIAL_MATCH':
      case 'ENTERPRISE_ATS':
      case 'STANDARD_MULTI_STAGE':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{label}</span>
          </span>
        );
      case 'DETECTED':
      case 'PUBLIC_FREE_EMAIL':
      case 'INFORMAL_DIRECT':
      case 'OFFICIAL_EMAIL':
      case 'DIRECT_PHONE':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>{label}</span>
          </span>
        );
      case 'DOMAIN_MISMATCH':
      case 'UNOFFICIAL_CHAT_APP':
      case 'NO_INTERVIEW_INSTANT_OFFER':
      case 'PAYMENT_GATED':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>{label}</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>{label}</span>
          </span>
        );
    }
  };

  const isSevere = consistency.overallConsistency === 'SEVERE_MISMATCH';
  const isPartial = consistency.overallConsistency === 'PARTIAL_INCONSISTENCY';
  const isStrong = consistency.overallConsistency === 'STRONG_ALIGNMENT';

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50 uppercase">
              ORGANIZATION INTELLIGENCE
            </span>
            <span className="text-xs text-slate-400 font-mono">
              5-Point Identity Correlation Vector
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white font-['Outfit'] mt-1">
            Organization & Recruiter Consistency
          </h3>
        </div>

        {/* Overall Status Pill */}
        <div>
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold tracking-wider border flex items-center space-x-1.5 ${
              isSevere
                ? 'bg-rose-950/90 text-rose-300 border-rose-700 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                : isPartial
                ? 'bg-amber-950/90 text-amber-300 border-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : isStrong
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>OVERALL: {consistency.overallConsistency.replace('_', ' ')}</span>
          </span>
        </div>
      </div>

      {/* 5-Point Vector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item 1: Organization Identity */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>1. Organization Identity</span>
            </div>
            {getStatusBadge(consistency.orgIdentityStatus, consistency.orgIdentityStatus)}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pl-6">
            {consistency.orgIdentityNotes}
          </p>
        </div>

        {/* Item 2: Official Domain */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>2. Official Corporate Domain</span>
            </div>
            {getStatusBadge(consistency.officialDomainStatus, consistency.officialDomainStatus)}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pl-6">
            {consistency.officialDomainNotes}
          </p>
        </div>

        {/* Item 3: Recruiter Domain */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Mail className="w-4 h-4 text-purple-400" />
              <span>3. Recruiter Domain & Contact</span>
            </div>
            {getStatusBadge(consistency.recruiterDomainStatus, consistency.recruiterDomainStatus.replace('_', ' '))}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pl-6">
            {consistency.recruiterDomainNotes}
          </p>
        </div>

        {/* Item 4: Contact Platform */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>4. Application Ingestion Platform</span>
            </div>
            {getStatusBadge(consistency.contactPlatformStatus, consistency.contactPlatformStatus.replace('_', ' '))}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pl-6">
            {consistency.contactPlatformNotes}
          </p>
        </div>

        {/* Item 5: Recruitment Workflow (Full Width) */}
        <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Workflow className="w-4 h-4 text-amber-400" />
              <span>5. Recruitment & Selection Workflow</span>
            </div>
            {getStatusBadge(consistency.recruitmentWorkflowStatus, consistency.recruitmentWorkflowStatus.replace('_', ' '))}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pl-6">
            {consistency.recruitmentWorkflowNotes}
          </p>
        </div>
      </div>
    </div>
  );
};
