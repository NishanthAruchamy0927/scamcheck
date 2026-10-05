import { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { OpportunityIntake } from './components/OpportunityIntake';
import { InvestigationPipeline } from './components/InvestigationPipeline';
import { InvestigationReportView } from './components/InvestigationReport';
import { ComparisonWorkspace } from './components/ComparisonWorkspace';
import { CompanyCheckWorkspace } from './components/CompanyCheckWorkspace';
import { IntelligenceDashboard } from './components/IntelligenceDashboard';
import { DemoSelector } from './components/DemoSelector';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Footer } from './components/Footer';

import { InvestigationReport, DemoCase } from './types/investigation';
import {
  investigateOpportunity,
  fetchDemos,
  checkBackendHealth
} from './services/api';
import {
  getStoredInvestigations,
  saveInvestigation,
  deleteStoredInvestigation,
  clearAllInvestigations
} from './services/storage';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('investigate');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [activeReport, setActiveReport] = useState<InvestigationReport | null>(null);
  const [pendingReport, setPendingReport] = useState<InvestigationReport | null>(null);
  const [history, setHistory] = useState<InvestigationReport[]>([]);
  const [demos, setDemos] = useState<DemoCase[]>([]);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [investigationError, setInvestigationError] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    // Load local history
    const stored = getStoredInvestigations();
    setHistory(stored);

    // Load demos
    fetchDemos().then((d) => {
      setDemos(d);
    });

    // Check backend health
    checkBackendHealth().then((healthy) => {
      setIsBackendHealthy(healthy);
    });

    // Periodic health check
    const interval = setInterval(() => {
      checkBackendHealth().then(setIsBackendHealthy);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleStartInvestigation = async (payload: {
    text?: string;
    file?: File;
    files?: File[];
    url?: string;
    linkedinUrl?: string;
  }) => {
    setIsInvestigating(true);
    setPipelineComplete(false);
    setActiveReport(null);
    setPendingReport(null);
    setInvestigationError(null);
    setActiveTab('investigate');

    try {
      const report = await investigateOpportunity(payload);
      setPendingReport(report);
    } catch (err: any) {
      console.error('Investigation error:', err);
      setInvestigationError(err.message || 'Investigation failed. Please try again.');
      setIsInvestigating(false);
    }
  };

  const handlePipelineComplete = () => {
    setPipelineComplete(true);
  };

  useEffect(() => {
    if (!pipelineComplete || !pendingReport) return;

    setActiveReport(pendingReport);
    saveInvestigation(pendingReport);
    setHistory(getStoredInvestigations());
    setPendingReport(null);
    setPipelineComplete(false);
    setIsInvestigating(false);
  }, [pipelineComplete, pendingReport]);

  const handleSelectDemo = (demo: DemoCase) => {
    handleStartInvestigation({ text: demo.content });
  };

  const handleSelectHistoryReport = (report: InvestigationReport) => {
    setActiveReport(report);
    setIsInvestigating(false);
    setActiveTab('investigate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string) => {
    const updated = deleteStoredInvestigation(id);
    setHistory(updated);
    if (activeReport?.id === id) {
      setActiveReport(null);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all stored investigation cases?')) {
      clearAllInvestigations();
      setHistory([]);
      setActiveReport(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col cyber-grid relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 cyber-grid-radial pointer-events-none" />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'investigate') {
            setIsInvestigating(false);
          }
        }}
        historyCount={history.length}
        isBackendHealthy={isBackendHealthy}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Tab 1: Investigate */}
        {activeTab === 'investigate' && (
          <>
            {/* Show Hero only when not in active report or pipeline */}
            {!activeReport && !isInvestigating && (
              <HeroSection
                onStartAnalysis={() => {
                  const intakeEl = document.getElementById('intake-station');
                  if (intakeEl) {
                    intakeEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                onOpenDemo={() => setActiveTab('demos')}
              />
            )}

            {/* Investigation error (shown above the form so the student can fix and resubmit) */}
            {investigationError && !isInvestigating && !activeReport && (
              <div role="alert" className="max-w-4xl mx-auto mt-6 flex items-start justify-between gap-3 p-4 rounded-2xl bg-rose-950/60 border border-rose-800/50 text-rose-200 text-sm">
                <span>
                  <strong className="font-bold">Investigation failed:</strong> {investigationError}
                </span>
                <button
                  onClick={() => setInvestigationError(null)}
                  className="text-rose-300 hover:text-white text-xs font-mono flex-shrink-0"
                  aria-label="Dismiss error"
                >
                  DISMISS
                </button>
              </div>
            )}

            {/* Ingestion Intake Form: kept mounted (only hidden) while analysing, so a failed
                request does not wipe the text and files the student entered */}
            {!activeReport && (
              <div id="intake-station" className={isInvestigating ? 'hidden' : undefined}>
                <OpportunityIntake
                  onInvestigate={handleStartInvestigation}
                  isLoading={isInvestigating}
                  demos={demos}
                />
              </div>
            )}

            {/* Live SOC Investigation Pipeline (Animated Staged Radar) */}
            {isInvestigating && (
              <InvestigationPipeline isResultReady={!!pendingReport} onComplete={handlePipelineComplete} />
            )}

            {/* Completed Investigation Report */}
            {activeReport && !isInvestigating && (
              <InvestigationReportView
                report={activeReport}
                onReset={() => {
                  setActiveReport(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenHistory={() => {
                  setActiveTab('history');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenCompare={() => {
                  setActiveTab('compare');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </>
        )}

        {/* Tab 2: Compare Opportunities */}
        {activeTab === 'compare' && (
          <ComparisonWorkspace demos={demos} />
        )}

        {/* Tab: Company credibility & career value */}
        {activeTab === 'company' && <CompanyCheckWorkspace />}

        {/* Tab 3: Intelligence Dashboard */}
        {activeTab === 'dashboard' && (
          <IntelligenceDashboard
            history={history}
            onSelectInvestigation={handleSelectHistoryReport}
            onClearHistory={handleClearAllHistory}
          />
        )}

        {/* Tab 4: Demo Catalog */}
        {activeTab === 'demos' && (
          <DemoSelector
            demos={demos}
            onSelectDemo={handleSelectDemo}
          />
        )}

        {/* Tab 5: History Viewer */}
        {activeTab === 'history' && (
          <HistoryDrawer
            history={history}
            onSelectInvestigation={handleSelectHistoryReport}
            onDeleteInvestigation={handleDeleteHistory}
            onClearHistory={handleClearAllHistory}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

export default App;
