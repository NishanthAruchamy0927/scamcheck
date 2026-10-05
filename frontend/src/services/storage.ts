import { InvestigationReport } from '../types/investigation';

const STORAGE_KEY = 'scamcheck_investigation_history_v1';

export function getStoredInvestigations(): InvestigationReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse investigation history from localStorage:', e);
    return [];
  }
}

export function saveInvestigation(report: InvestigationReport): void {
  try {
    const existing = getStoredInvestigations();
    // Filter out if already exists
    const filtered = existing.filter((item) => item.id !== report.id);
    // Add to top, max 50 items
    const updated = [report, ...filtered].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save investigation to localStorage:', e);
  }
}

export function deleteStoredInvestigation(id: string): InvestigationReport[] {
  try {
    const existing = getStoredInvestigations();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete investigation from localStorage:', e);
    return [];
  }
}

export function clearAllInvestigations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear investigation history:', e);
  }
}
