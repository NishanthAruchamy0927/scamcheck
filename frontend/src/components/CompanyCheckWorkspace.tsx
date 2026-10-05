import React, { useState } from 'react';
import { Building2, Linkedin } from 'lucide-react';
import { CompanyCredibilityReport, LinkedInCompanyFacts } from '../types/investigation';
import { checkCompany } from '../services/api';
import { CompanyCredibilityPanel } from './CompanyCredibilityPanel';

const inputClass =
  'w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all';

const labelClass = 'text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400';

export const CompanyCheckWorkspace: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [offerText, setOfferText] = useState('');
  const [followers, setFollowers] = useState('');
  const [employees, setEmployees] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [website, setWebsite] = useState('');
  const [internsPlaced, setInternsPlaced] = useState<'' | 'yes' | 'no' | 'unknown'>('');
  const [certificatePosts, setCertificatePosts] = useState<'' | 'yes' | 'no'>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyCredibilityReport | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim() && !linkedinUrl.trim() && !offerText.trim()) {
      setError('Enter a company name, its LinkedIn page, or paste the offer text.');
      return;
    }

    const linkedinFacts: LinkedInCompanyFacts = {
      followers: followers.trim() ? Number(followers.replace(/[,\s]/g, '')) : undefined,
      employeesOnLinkedIn: employees.trim() ? Number(employees.replace(/[,\s]/g, '')) : undefined,
      foundedYear: foundedYear.trim() ? Number(foundedYear) : undefined,
      website: website.trim() || undefined,
      internsPlacedAtGoodCompanies: internsPlaced || undefined,
      postsMostlyCertificates: certificatePosts === '' ? undefined : certificatePosts === 'yes'
    };

    setIsLoading(true);
    try {
      const report = await checkCompany({
        companyName: companyName.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        offerText: offerText.trim() || undefined,
        linkedinFacts
      });
      setResult(report);
    } catch (err: any) {
      setError(err.message || 'Company check failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/50 text-indigo-300 text-xs font-mono">
          <Building2 className="w-3.5 h-3.5" />
          <span>COMPANY &amp; CAREER VALUE CHECK</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">Is this company worth it?</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Check a company's LinkedIn footprint and find out whether its internship or certificate program will actually help you get into a good company.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company + offer */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="cc-name">Company name</label>
            <input id="cc-name" className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. CodeSkill Infotech" maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="cc-linkedin">LinkedIn company page</label>
            <input id="cc-linkedin" type="url" className={inputClass} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/company/..." maxLength={300} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="cc-offer">Offer / program details (optional but recommended)</label>
            <textarea
              id="cc-offer"
              rows={7}
              className={`${inputClass} resize-y`}
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              placeholder="Paste the internship offer, fee details, what you'll work on, how you were selected..."
            />
          </div>
        </div>

        {/* LinkedIn facts */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-start space-x-2">
            <Linkedin className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              LinkedIn usually blocks automatic reading. Open the company page and copy these numbers for an accurate result. Leave blank anything you can't find.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="cc-followers">Followers</label>
              <input id="cc-followers" inputMode="numeric" className={inputClass} value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="e.g. 45,000" />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="cc-employees">Employees on LinkedIn</label>
              <input id="cc-employees" inputMode="numeric" className={inputClass} value={employees} onChange={(e) => setEmployees(e.target.value)} placeholder='"View all N employees"' />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="cc-founded">Founded year</label>
              <input id="cc-founded" inputMode="numeric" className={inputClass} value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="e.g. 2019" maxLength={4} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="cc-website">Website on profile</label>
              <input id="cc-website" className={inputClass} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="e.g. company.com" maxLength={200} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="cc-alumni">Do past interns now work at good companies?</label>
            <select id="cc-alumni" className={inputClass} value={internsPlaced} onChange={(e) => setInternsPlaced(e.target.value as typeof internsPlaced)}>
              <option value="">Didn't check</option>
              <option value="yes">Yes — several moved on to reputable companies</option>
              <option value="no">No — couldn't find any</option>
              <option value="unknown">Couldn't tell</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="cc-posts">Are most company posts interns sharing certificates?</label>
            <select id="cc-posts" className={inputClass} value={certificatePosts} onChange={(e) => setCertificatePosts(e.target.value as typeof certificatePosts)}>
              <option value="">Didn't check</option>
              <option value="yes">Yes</option>
              <option value="no">No — real product/company updates</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="lg:col-span-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs text-center">{error}</div>
        )}

        <div className="lg:col-span-2 text-center">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] disabled:opacity-50"
          >
            {isLoading ? 'CHECKING COMPANY...' : 'CHECK COMPANY'}
          </button>
        </div>
      </form>

      {result && <CompanyCredibilityPanel report={result} />}
    </div>
  );
};
