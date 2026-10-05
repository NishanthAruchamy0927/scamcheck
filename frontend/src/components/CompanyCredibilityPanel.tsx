import React from 'react';
import {
  Building2,
  Linkedin,
  GraduationCap,
  CheckCircle2,
  XCircle,
  ListChecks,
  Lightbulb,
  Info
} from 'lucide-react';
import {
  CompanyCredibilityReport,
  CompanyCredibilityVerdict,
  CareerValueVerdict,
  CredibilityFactor
} from '../types/investigation';

interface CompanyCredibilityPanelProps {
  report: CompanyCredibilityReport;
}

const COMPANY_VERDICT: Record<CompanyCredibilityVerdict, { label: string; tone: string }> = {
  REPUTABLE: { label: 'REPUTABLE', tone: 'text-emerald-300 bg-emerald-950 border-emerald-800/60' },
  CREDIBLE: { label: 'CREDIBLE', tone: 'text-cyan-300 bg-cyan-950 border-cyan-800/60' },
  UNPROVEN: { label: 'UNPROVEN', tone: 'text-amber-300 bg-amber-950 border-amber-800/60' },
  RED_FLAGS: { label: 'RED FLAGS', tone: 'text-rose-300 bg-rose-950 border-rose-800/60' }
};

const CAREER_VERDICT: Record<CareerValueVerdict, { label: string; tone: string }> = {
  HIGH_VALUE: { label: 'HIGH CAREER VALUE', tone: 'text-emerald-300 bg-emerald-950 border-emerald-800/60' },
  MODERATE_VALUE: { label: 'SOME VALUE', tone: 'text-cyan-300 bg-cyan-950 border-cyan-800/60' },
  LOW_VALUE: { label: 'LOW VALUE', tone: 'text-amber-300 bg-amber-950 border-amber-800/60' },
  AVOID: { label: 'AVOID', tone: 'text-rose-300 bg-rose-950 border-rose-800/60' },
  NOT_ENOUGH_INFO: { label: 'NOT ENOUGH INFO', tone: 'text-slate-300 bg-slate-900 border-slate-700' }
};

const LINKEDIN_STATUS: Record<CompanyCredibilityReport['linkedin']['status'], string> = {
  NOT_PROVIDED: 'Not provided',
  INVALID_URL: 'Not a company page',
  PERSONAL_PROFILE: 'Personal profile only',
  FETCHED: 'Public page read',
  BLOCKED_OR_UNREACHABLE: 'LinkedIn blocked automatic read'
};

const scoreColor = (score: number) =>
  score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-cyan-400' : score >= 30 ? 'text-amber-400' : 'text-rose-400';

const FactorList: React.FC<{ items: CredibilityFactor[]; empty: string }> = ({ items, empty }) =>
  items.length === 0 ? (
    <p className="text-xs text-slate-500 font-mono p-3 rounded-xl bg-slate-950/60 border border-slate-800">{empty}</p>
  ) : (
    <ul className="space-y-2">
      {items.map((f, idx) => (
        <li key={idx} className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          {f.impact >= 0 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200">{f.label}</span>
              <span className={`text-[10px] font-mono font-bold ${f.impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {f.impact >= 0 ? `+${f.impact}` : f.impact}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{f.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );

export const CompanyCredibilityPanel: React.FC<CompanyCredibilityPanelProps> = ({ report }) => {
  const { linkedin, careerValue } = report;
  const companyVerdict = COMPANY_VERDICT[report.verdict];
  const careerVerdict = CAREER_VERDICT[careerValue.verdict];

  const facts: { label: string; value?: string; source?: string }[] = [
    { label: 'Followers', value: linkedin.facts.followers?.toLocaleString('en-IN'), source: linkedin.factSources.followers },
    { label: 'Employees on LinkedIn', value: linkedin.facts.employeesOnLinkedIn?.toLocaleString('en-IN'), source: linkedin.factSources.employeesOnLinkedIn },
    { label: 'Company size', value: linkedin.facts.companySize, source: linkedin.factSources.companySize },
    { label: 'Founded', value: linkedin.facts.foundedYear?.toString(), source: linkedin.factSources.foundedYear },
    { label: 'Industry', value: linkedin.facts.industry, source: linkedin.factSources.industry },
    { label: 'Website', value: linkedin.facts.website, source: linkedin.factSources.website }
  ].filter((f) => f.value);

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-300">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 uppercase">
            COMPANY &amp; CAREER CHECK
          </span>
          <h3 className="text-base font-bold text-slate-100 font-['Outfit'] mt-0.5">
            Is {report.companyName} a good place to start your career?
          </h3>
        </div>
      </div>

      {/* Two verdict cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Company credibility</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${companyVerdict.tone}`}>{companyVerdict.label}</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className={`text-3xl font-black font-['Outfit'] ${scoreColor(report.credibilityScore)}`}>{report.credibilityScore}</span>
            <span className="text-xs text-slate-500 font-mono">/100 · evidence {report.evidenceLevel.toLowerCase()}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{report.summary}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Career value for students</span>
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${careerVerdict.tone}`}>{careerVerdict.label}</span>
          </div>
          <div className="flex items-baseline space-x-1">
            {careerValue.verdict === 'NOT_ENOUGH_INFO' ? (
              <span className="text-3xl font-black font-['Outfit'] text-slate-500">—</span>
            ) : (
              <>
                <span className={`text-3xl font-black font-['Outfit'] ${scoreColor(careerValue.score)}`}>{careerValue.score}</span>
                <span className="text-xs text-slate-500 font-mono">/100</span>
              </>
            )}
          </div>
          <p className="text-[11px] font-mono text-slate-400">{careerValue.programModelLabel}</p>
          <p className="text-xs font-bold text-slate-200 leading-relaxed">{careerValue.headline}</p>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-950/60 border border-slate-800">{careerValue.explanation}</p>

      {/* LinkedIn footprint */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Linkedin className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-200">LinkedIn footprint</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
            {LINKEDIN_STATUS[linkedin.status]}
          </span>
          {linkedin.url && linkedin.status !== 'INVALID_URL' && /^https?:\/\//i.test(linkedin.url) && (
            <a
              href={linkedin.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-sky-400 hover:text-sky-300 underline break-all"
            >
              {linkedin.url}
            </a>
          )}
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">{linkedin.statusDetail}</p>
        {facts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {facts.map((f) => (
              <div key={f.label} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{f.label}</div>
                <div className="text-xs font-bold text-slate-200 break-words">{f.value}</div>
                {f.source && (
                  <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                    {f.source === 'USER_PROVIDED' ? 'entered by you' : 'from LinkedIn'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">What drives the company score</div>
          <FactorList items={report.factors} empty="No company evidence yet. Add the LinkedIn page details to score the company." />
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">What drives the career value</div>
          <FactorList
            items={[...careerValue.positives, ...careerValue.concerns]}
            empty="The offer does not say enough about pay, selection or the work itself."
          />
        </div>
      </div>

      {/* Advice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
            <ListChecks className="w-3.5 h-3.5" />
            <span>{careerValue.verdict === 'HIGH_VALUE' ? 'Make the most of it' : 'Before you join or pay'}</span>
          </div>
          <ul className="space-y-1.5">
            {careerValue.makeItWorthwhile.map((tip, idx) => (
              <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start space-x-2">
                <span className="text-cyan-500 font-mono">{idx + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        {careerValue.betterAlternatives.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Better ways to get into a good company</span>
            </div>
            <ul className="space-y-1.5">
              {careerValue.betterAlternatives.map((alt, idx) => (
                <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start space-x-2">
                  <span className="text-amber-500">•</span>
                  <span>{alt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* LinkedIn checklist */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-1">
          <Linkedin className="w-3.5 h-3.5" />
          <span>Check these yourself on LinkedIn</span>
        </div>
        <ul className="space-y-1.5">
          {report.linkedinChecklist.map((item, idx) => (
            <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed flex items-start space-x-1.5">
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span>{report.disclaimer}</span>
      </p>
    </div>
  );
};
