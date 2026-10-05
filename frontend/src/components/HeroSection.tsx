import React from 'react';
import {
  Search,
  Sparkles,
  FileText,
  Link,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Zap,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface HeroSectionProps {
  onStartAnalysis: () => void;
  onOpenDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartAnalysis,
  onOpenDemo
}) => {
  return (
    <div className="relative overflow-hidden pt-8 pb-16">
      {/* Background Cyber Glow Gradients */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-10 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse-glow">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI-Powered Opportunity Intelligence & Threat Verification</span>
          </div>

          {/* Core Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-['Outfit']">
            Verify before you{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent underline decoration-cyan-500/40 decoration-4 underline-offset-8">
              trust.
            </span>
          </h1>

          {/* Secondary Statement & Subheading */}
          <p className="text-lg sm:text-2xl font-medium text-slate-200 font-['Outfit'] max-w-3xl mx-auto">
            AI-powered analysis for internships, jobs, scholarships, and opportunities.
          </p>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Don't just detect scams — investigate the opportunity. Evaluate advance-fee patterns, recruiter domain consistency, credential harvesting, and evidence chains before you commit.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartAnalysis}
              className="flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] transform hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4 text-slate-950 font-bold" />
              <span>Analyze an Opportunity</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={onOpenDemo}
              className="flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 font-semibold text-sm tracking-wide transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Try Demo Scenarios</span>
            </button>
          </div>

          {/* Supported Inputs Chips */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-medium">
            <span className="text-slate-500">Supported Inputs:</span>
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Paste Message / Email</span>
            </span>
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Upload Document (.pdf, .docx, .png OCR)</span>
            </span>
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <Link className="w-3.5 h-3.5 text-teal-400" />
              <span>Analyze URL</span>
            </span>
          </div>

          {/* Trust Statement */}
          <div className="pt-2">
            <p className="text-xs text-cyan-300/80 italic font-mono bg-cyan-950/30 py-1.5 px-4 rounded-full inline-block border border-cyan-800/30">
              "Designed to identify suspicious patterns without guessing when evidence is insufficient."
            </p>
          </div>
        </div>

        {/* Live Product Teaser / SOC Visual Preview */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="relative rounded-2xl glass-panel p-1 border border-slate-700/60 shadow-2xl bg-gradient-to-b from-slate-900/80 to-slate-950/90">
            {/* Header bar of preview */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 rounded-t-xl">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  SCAMCHECK_SOC_AUDIT_TERMINAL // LIVE INVESTIGATION
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>HYBRID ENGINE ONLINE</span>
              </div>
            </div>

            {/* Content Preview Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: High Risk Case */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-900/40 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/50">
                    HIGH RISK // 87/100
                  </span>
                  <span className="text-[10px] text-slate-400">93% Confidence</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">Fake TCS Internship Offer</h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  "₹2,999 security deposit requested via UPI for laptop kit dispatch within 24 hours."
                </p>
                <div className="text-[11px] font-mono text-rose-300/90 space-y-1 bg-slate-950/60 p-2 rounded border border-rose-900/30">
                  <div>✗ Recruiter: hr.tcs@gmail.com</div>
                  <div>✗ Fee: ₹2,999 advance payment</div>
                  <div>✗ Action: STOP & CEASE CONTACT</div>
                </div>
              </div>

              {/* Card 2: Needs Verification Case */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-900/40 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
                    NEEDS VERIFICATION // 48/100
                  </span>
                  <span className="text-[10px] text-slate-400">52% Confidence</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">Stealth Startup React Gig</h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  "Early-stage proposal with sparse web footprint and personal webmail, but zero fee demanded."
                </p>
                <div className="text-[11px] font-mono text-amber-300/90 space-y-1 bg-slate-950/60 p-2 rounded border border-amber-900/30">
                  <div>? Domain: Missing corporate site</div>
                  <div>✓ Fee: ₹0 demanded</div>
                  <div>⚡ Action: INDEPENDENT CONFIRMATION</div>
                </div>
              </div>

              {/* Card 3: Low Risk Verified Case */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-900/40 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                    LOW RISK // 14/100
                  </span>
                  <span className="text-[10px] text-slate-400">92% Confidence</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">Google SWE Internship</h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  "Standard multi-round coding interviews, verified @google.com recruiter, official portal."
                </p>
                <div className="text-[11px] font-mono text-emerald-300/90 space-y-1 bg-slate-950/60 p-2 rounded border border-emerald-900/30">
                  <div>✓ Domain: Authenticated @google.com</div>
                  <div>✓ Process: Technical Loop Rounds</div>
                  <div>✓ Action: PROCEED WITH CAUTION</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Core Detection Capabilities Section */}
        <div className="mt-24">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Multi-Signal Threat Detection Matrix
            </h2>
            <p className="text-slate-400 text-sm">
              ScamCheck examines opportunities across 22+ independent threat vectors rather than simplistic sentiment classification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">Advance-Fee & Deposit Extraction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detects disguised registration charges, mandatory paid training kits, hardware courier fees, and fake check reimbursement schemes.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">Credential & Identity Harvesting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Flags requests for OTPs, banking PINs, netbanking credentials, and premature national ID document scans (Aadhaar, PAN, SSN).
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">Domain & Recruiter Consistency</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cross-references claimed corporate entities against verified official domains, exposing public Gmail/Yahoo handles posing as Fortune 500 HR.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">Urgency & FOMO Manipulation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identifies psychological pressure tactics including 24-hour expiration windows and artificial "only 2 slots left" scarcity framing.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">Fake Selection & Phantom Jobs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Catches instant "direct selection without interview" patterns and task-based rating/video-liking prepaid commission traps.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">Positive Trust Offsets</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies calibrated negative risk offsets for authentic enterprise ATS systems (Greenhouse, Workday), documented interviews, and zero-fee policies.
              </p>
            </div>
          </div>
        </div>

        {/* How ScamCheck Works — 5-Step Explainable Architecture */}
        <div className="mt-24">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>TRANSPARENT & EXPLAINABLE PIPELINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              How ScamCheck Works
            </h2>
            <p className="text-slate-400 text-sm">
              AI assists with contextual analysis. The final risk score is generated from structured risk signals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2 relative">
              <div className="text-xs font-mono font-bold text-cyan-400">01 // EXTRACT</div>
              <h3 className="text-sm font-bold text-slate-100">Structured Parsing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Normalizes text, OCR screenshots, PDFs, or URLs to isolate claims, organizations, recruiters, fees, and contacts.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2 relative">
              <div className="text-xs font-mono font-bold text-teal-400">02 // DETECT</div>
              <h3 className="text-sm font-bold text-slate-100">Signal Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scans 22+ deterministic heuristics for advance fees, OTP theft, webmail misuse, and artificial deadlines.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2 relative">
              <div className="text-xs font-mono font-bold text-blue-400">03 // CORRELATE</div>
              <h3 className="text-sm font-bold text-slate-100">Contradiction Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cross-checks recruiter handles against authoritative registries and exposes "free vs fee" claim contradictions.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2 relative">
              <div className="text-xs font-mono font-bold text-amber-400">04 // SCORE</div>
              <h3 className="text-sm font-bold text-slate-100">Clustered Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Computes mathematical risk (0–100) via anti-double-counting cluster dampeners and calibrated negative trust offsets.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2 relative">
              <div className="text-xs font-mono font-bold text-emerald-400">05 // RECOMMEND</div>
              <h3 className="text-sm font-bold text-slate-100">Action Playbook</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Issues unambiguous executive directives (STOP, VERIFY, PROCEED) with practical independent validation steps.
              </p>
            </div>
          </div>
        </div>

        {/* Safety Philosophy Banner */}
        <div className="mt-20 p-8 rounded-2xl glass-panel border border-cyan-900/40 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h3 className="text-xl font-bold text-white font-['Outfit']">
              The ScamCheck Safety Philosophy
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              "We never force every submission into a blunt SAFE or SCAM binary. When evidence is sparse or contradictory, ScamCheck refuses to guess — highlighting missing verification anchors and guiding the user to conduct safe due diligence."
            </p>
            <div className="pt-2">
              <button
                onClick={onStartAnalysis}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Launch Live Investigation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
