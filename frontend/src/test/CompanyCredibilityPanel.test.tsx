import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompanyCredibilityPanel } from '../components/CompanyCredibilityPanel';
import { CompanyCredibilityReport } from '../types/investigation';

const baseReport = (overrides: Partial<CompanyCredibilityReport> = {}): CompanyCredibilityReport => ({
  companyName: 'CodeSkill Infotech',
  isKnownEnterprise: false,
  credibilityScore: 15,
  verdict: 'RED_FLAGS',
  evidenceLevel: 'STRONG',
  summary: 'CodeSkill Infotech shows red flags.',
  factors: [{ label: 'Followers far exceed employees', impact: -12, detail: '45,000 followers but 8 employees.' }],
  linkedin: {
    url: 'https://www.linkedin.com/company/codeskill/',
    slug: 'codeskill',
    status: 'BLOCKED_OR_UNREACHABLE',
    statusDetail: 'LinkedIn blocks most automated reads.',
    pageTitle: null,
    facts: { followers: 45000, employeesOnLinkedIn: 8 },
    factSources: { followers: 'USER_PROVIDED', employeesOnLinkedIn: 'USER_PROVIDED' }
  },
  careerValue: {
    programModel: 'PAY_FOR_CERTIFICATE',
    programModelLabel: 'Pay-for-certificate "internship"',
    score: 0,
    verdict: 'AVOID',
    headline: 'Not worth it — this will not help you get into a good company.',
    explanation: 'Little real work.',
    positives: [],
    concerns: [{ label: 'You pay to get a certificate', impact: -35, detail: 'Not counted as experience.' }],
    makeItWorthwhile: ['Ask for a written project scope.'],
    betterAlternatives: ['NPTEL courses.']
  },
  linkedinChecklist: ['Compare followers with employees.'],
  disclaimer: 'Signals are a guide.',
  ...overrides
});

describe('CompanyCredibilityPanel', () => {
  it('shows both verdicts, the facts the student entered and the advice', () => {
    render(<CompanyCredibilityPanel report={baseReport()} />);
    expect(screen.getByText('RED FLAGS')).toBeInTheDocument();
    expect(screen.getByText('AVOID')).toBeInTheDocument();
    expect(screen.getByText('Followers far exceed employees')).toBeInTheDocument();
    expect(screen.getAllByText('entered by you')).toHaveLength(2);
    expect(screen.getByText('NPTEL courses.')).toBeInTheDocument();
  });

  it('only links to http(s) LinkedIn URLs, never javascript: URLs', () => {
    const report = baseReport();
    report.linkedin = { ...report.linkedin, url: 'javascript:alert(1)', status: 'INVALID_URL' };
    render(<CompanyCredibilityPanel report={report} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a dash instead of a score when there is not enough information', () => {
    const report = baseReport();
    report.careerValue = { ...report.careerValue, verdict: 'NOT_ENOUGH_INFO', programModel: 'UNCLEAR', concerns: [] };
    render(<CompanyCredibilityPanel report={report} />);
    expect(screen.getByText('NOT ENOUGH INFO')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
