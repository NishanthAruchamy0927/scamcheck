import assert from 'assert';

// PHASE 12: SCAMCHECK SOC Core Logic Simulation

// Mock Database State
const DB = {
  incidents: [
    { id: 'INC-001', title: 'Fake Job Offer', severity: 'HIGH', status: 'INVESTIGATING', riskScore: 82, orgId: 'ORG-A', campaignId: 'CAMP-1', lastUpdated: new Date('2026-09-24T10:00:00Z') },
    { id: 'INC-002', title: 'Phishing Email', severity: 'MEDIUM', status: 'OPEN', riskScore: 65, orgId: 'ORG-A', campaignId: null, lastUpdated: new Date('2026-09-24T09:00:00Z') },
    { id: 'INC-003', title: 'Payment Fraud', severity: 'CRITICAL', status: 'OPEN', riskScore: 95, orgId: 'ORG-B', campaignId: 'CAMP-1', lastUpdated: new Date('2026-09-25T01:00:00Z') }
  ],
  campaigns: [
    { id: 'CAMP-1', name: 'Fake Recruitment Ring', status: 'UNDER_REVIEW' }
  ],
  iocs: [
    { id: 'ENT-001', type: 'DOMAIN', value: 'example-careers.com', risk: 80, investigations: 2 },
    { id: 'ENT-002', type: 'EMAIL', value: 'hr@example-careers.com', risk: 75, investigations: 1 }
  ],
  organizations: [
    { id: 'ORG-A', name: 'Example Corp', verificationStatus: 'VERIFIED' },
    { id: 'ORG-B', name: 'Acme Ltd', verificationStatus: 'PARTIALLY_VERIFIED' }
  ],
  auditLogs: [] as any[]
};

class SocRbacService {
  static canAccessSoc(role: string): boolean {
    return ['SECURITY_ANALYST', 'SYSTEM_ADMIN'].includes(role);
  }

  static filterIncidentsByTenant(userRole: string, userOrgId: string | null, incidents: any[]): any[] {
    if (this.canAccessSoc(userRole)) return incidents; // Analysts see all
    if (userRole === 'ORGANIZATION_ADMIN' && userOrgId) {
      return incidents.filter(inc => inc.orgId === userOrgId);
    }
    return []; // Users see nothing in SOC queue
  }
}

class SocDashboardService {
  static getOverview(userRole: string, userOrgId: string | null) {
    const visibleIncidents = SocRbacService.filterIncidentsByTenant(userRole, userOrgId, DB.incidents);
    
    return {
      activeIncidents: visibleIncidents.filter(i => ['OPEN', 'INVESTIGATING'].includes(i.status)).length,
      highCritical: visibleIncidents.filter(i => ['HIGH', 'CRITICAL'].includes(i.severity)).length,
      activeCampaigns: SocRbacService.canAccessSoc(userRole) ? DB.campaigns.filter(c => c.status !== 'ARCHIVED').length : 0,
      newIocs: SocRbacService.canAccessSoc(userRole) ? DB.iocs.length : 0
    };
  }

  static getIncidentQueue(userRole: string, userOrgId: string | null, filters: { severity?: string, status?: string }) {
    let incidents = SocRbacService.filterIncidentsByTenant(userRole, userOrgId, DB.incidents);
    
    if (filters.severity) incidents = incidents.filter(i => i.severity === filters.severity);
    if (filters.status) incidents = incidents.filter(i => i.status === filters.status);
    
    // Sort by Risk Descending (Prioritization)
    return incidents.sort((a, b) => b.riskScore - a.riskScore);
  }
}

class SocSearchService {
  static searchGlobal(userRole: string, userOrgId: string | null, query: string) {
    if (!SocRbacService.canAccessSoc(userRole)) {
      throw new Error('UNAUTHORIZED_SEARCH');
    }
    const term = query.toLowerCase();
    
    return {
      incidents: DB.incidents.filter(i => i.id.toLowerCase().includes(term) || i.title.toLowerCase().includes(term)),
      iocs: DB.iocs.filter(i => i.value.toLowerCase().includes(term)),
      campaigns: DB.campaigns.filter(c => c.id.toLowerCase().includes(term) || c.name.toLowerCase().includes(term))
    };
  }
}

class SocActionService {
  static updateIncidentStatus(actorId: string, actorRole: string, incidentId: string, newStatus: string) {
    if (!SocRbacService.canAccessSoc(actorRole)) throw new Error('UNAUTHORIZED_ACTION');
    
    const incident = DB.incidents.find(i => i.id === incidentId);
    if (!incident) throw new Error('NOT_FOUND');
    
    const oldStatus = incident.status;
    incident.status = newStatus;
    
    DB.auditLogs.push({
      id: `AL-${Date.now()}`,
      actorId,
      action: 'UPDATE_INCIDENT_STATUS',
      resourceId: incidentId,
      metadata: { oldStatus, newStatus },
      timestamp: new Date()
    });
  }
}

async function runTests() {
  console.log('--- ScamCheck Phase 12 SOC Tests ---\n');

  console.log('[Test 1] Dashboard RBAC & Aggregation');
  const analystOverview = SocDashboardService.getOverview('SECURITY_ANALYST', null);
  assert.strictEqual(analystOverview.activeIncidents, 3);
  assert.strictEqual(analystOverview.highCritical, 2);
  assert.strictEqual(analystOverview.activeCampaigns, 1);
  
  const orgAdminOverview = SocDashboardService.getOverview('ORGANIZATION_ADMIN', 'ORG-A');
  assert.strictEqual(orgAdminOverview.activeIncidents, 2); // Only ORG-A
  assert.strictEqual(orgAdminOverview.activeCampaigns, 0); // No global campaign view
  
  const userOverview = SocDashboardService.getOverview('USER', 'ORG-A');
  assert.strictEqual(userOverview.activeIncidents, 0);
  console.log('✅ PASS: Aggregation strictly respects Tenant & Role boundaries');

  console.log('\n[Test 2] Incident Queue Prioritization');
  const queue = SocDashboardService.getIncidentQueue('SECURITY_ANALYST', null, {});
  assert.strictEqual(queue[0].id, 'INC-003'); // Risk 95 should be first
  assert.strictEqual(queue[1].id, 'INC-001'); // Risk 82 should be second
  
  const filteredQueue = SocDashboardService.getIncidentQueue('SECURITY_ANALYST', null, { severity: 'MEDIUM' });
  assert.strictEqual(filteredQueue.length, 1);
  assert.strictEqual(filteredQueue[0].id, 'INC-002');
  console.log('✅ PASS: Queue prioritizes by risk & applies filters correctly');

  console.log('\n[Test 3] Global Analyst Search');
  const searchResults = SocSearchService.searchGlobal('SECURITY_ANALYST', null, 'example-careers');
  assert.strictEqual(searchResults.iocs.length, 2); // Both domain and email
  
  try {
    SocSearchService.searchGlobal('ORGANIZATION_ADMIN', 'ORG-A', 'example');
    assert.fail('Should deny search');
  } catch(e: any) {
    assert.strictEqual(e.message, 'UNAUTHORIZED_SEARCH');
  }
  console.log('✅ PASS: Global search executes securely with RBAC');

  console.log('\n[Test 4] Analyst Action & Audit Logging');
  SocActionService.updateIncidentStatus('ANALYST-1', 'SECURITY_ANALYST', 'INC-001', 'CONTAINMENT_RECOMMENDED');
  const inc = DB.incidents.find(i => i.id === 'INC-001');
  assert.strictEqual(inc?.status, 'CONTAINMENT_RECOMMENDED');
  assert.strictEqual(DB.auditLogs.length, 1);
  assert.strictEqual(DB.auditLogs[0].action, 'UPDATE_INCIDENT_STATUS');
  assert.strictEqual(DB.auditLogs[0].metadata.newStatus, 'CONTAINMENT_RECOMMENDED');
  console.log('✅ PASS: Security-sensitive actions enforce logging');

  console.log('\n--- ScamCheck Phase 12 SOC Tests Complete ---');
}

runTests().catch(console.error);
