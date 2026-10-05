import assert from 'assert';

// Phase 11 Services (Mocked for testing core logic without DB overhead)

class SafeNetworkClient {
  static async verifyDomain(domain: string): Promise<{status: string, provider: string}> {
    // Blocked IPs logic (SSRF Protection)
    if (domain === '169.254.169.254' || domain === 'localhost' || domain === '127.0.0.1') {
      throw new Error('SSRF_BLOCKED: Private or metadata IP addresses are not permitted.');
    }
    
    // Mock domain resolution
    if (domain === 'example.com') {
      return { status: 'VERIFIED', provider: 'DNS' };
    }
    return { status: 'UNVERIFIED', provider: 'DNS' };
  }
}

class OrganizationVerificationService {
  static analyzeDomainConsistency(claimedOrg: string, officialDomain: string, recruiterEmail: string): string {
    const emailDomain = recruiterEmail.split('@')[1];
    
    if (emailDomain === officialDomain) {
      return 'MATCH';
    }
    
    // E.g. example-careers.com vs example.com
    if (emailDomain.includes(officialDomain.split('.')[0]) && emailDomain !== officialDomain) {
      return 'LOOKALIKE_CANDIDATE';
    }
    
    // Generic emails
    if (['gmail.com', 'yahoo.com', 'outlook.com'].includes(emailDomain)) {
      return 'UNVERIFIED_GENERIC_EMAIL';
    }

    return 'MISMATCH';
  }

  static verifyOrganization(orgId: string, currentEvidence: any[]): { status: string, confidence: number } {
    if (currentEvidence.some(e => e.status === 'VERIFIED' && e.provider === 'ADMIN_ASSERTION')) {
      return { status: 'VERIFIED', confidence: 90 };
    }
    if (currentEvidence.some(e => e.status === 'VERIFIED' && e.provider === 'DNS')) {
      return { status: 'PARTIALLY_VERIFIED', confidence: 50 };
    }
    return { status: 'UNVERIFIED', confidence: 0 };
  }
}

class OpportunityAnalysisService {
  static analyze(opportunityData: any): any {
    const signals = [];
    let riskScore = 0;
    
    const text = opportunityData.description.toLowerCase();
    
    if (text.includes('pay') && (text.includes('training') || text.includes('deposit'))) {
      signals.push('PAYMENT_REQUEST_TRAINING_FEE');
      riskScore += 40;
    }
    
    if (text.includes('urgent') || text.includes('within 30 minutes') || text.includes('immediately')) {
      signals.push('URGENCY_SIGNAL');
      riskScore += 20;
    }
    
    if (opportunityData.domainConsistency === 'LOOKALIKE_CANDIDATE') {
      signals.push('LOOKALIKE_DOMAIN');
      riskScore += 30;
    }

    return {
      status: 'ANALYZED',
      signals,
      riskScore: Math.min(riskScore, 100),
      trustScore: Math.max(100 - riskScore - 20, 0),
      confidence: 85
    };
  }
}

class RbacService {
  static canManageOrganization(userRole: string, userOrgId: string, targetOrgId: string): boolean {
    if (userRole === 'SYSTEM_ADMIN') return true;
    if (userRole === 'ORGANIZATION_ADMIN' && userOrgId === targetOrgId) return true;
    return false;
  }
  
  static canViewIncident(userRole: string, userOrgId: string, targetOrgId: string): boolean {
    if (['SYSTEM_ADMIN', 'SECURITY_ANALYST'].includes(userRole)) return true;
    return userOrgId === targetOrgId;
  }
}


async function runTests() {
  console.log('--- ScamCheck Phase 11 Organization Protection Tests ---\n');

  console.log('[Test 1] SSRF Protection in SafeNetworkClient');
  try {
    await SafeNetworkClient.verifyDomain('169.254.169.254');
    assert.fail('Should have thrown SSRF_BLOCKED');
  } catch (e: any) {
    assert.ok(e.message.includes('SSRF_BLOCKED'));
    console.log('✅ PASS: Blocked AWS metadata IP');
  }
  
  try {
    await SafeNetworkClient.verifyDomain('localhost');
    assert.fail('Should have thrown SSRF_BLOCKED');
  } catch (e: any) {
    assert.ok(e.message.includes('SSRF_BLOCKED'));
    console.log('✅ PASS: Blocked localhost');
  }

  console.log('\n[Test 2] Domain Consistency Analysis');
  assert.strictEqual(OrganizationVerificationService.analyzeDomainConsistency('Acme Tech', 'acme.com', 'hr@acme.com'), 'MATCH');
  assert.strictEqual(OrganizationVerificationService.analyzeDomainConsistency('Acme Tech', 'acme.com', 'hr@acme-careers.com'), 'LOOKALIKE_CANDIDATE');
  assert.strictEqual(OrganizationVerificationService.analyzeDomainConsistency('Acme Tech', 'acme.com', 'hr@gmail.com'), 'UNVERIFIED_GENERIC_EMAIL');
  assert.strictEqual(OrganizationVerificationService.analyzeDomainConsistency('Acme Tech', 'acme.com', 'hr@someotherdomain.com'), 'MISMATCH');
  console.log('✅ PASS: Domain consistency rules correctly categorized');

  console.log('\n[Test 3] Organization Verification Logic');
  const emptyEvidence = OrganizationVerificationService.verifyOrganization('ORG-1', []);
  assert.strictEqual(emptyEvidence.status, 'UNVERIFIED');
  
  const partialEvidence = OrganizationVerificationService.verifyOrganization('ORG-2', [{ status: 'VERIFIED', provider: 'DNS' }]);
  assert.strictEqual(partialEvidence.status, 'PARTIALLY_VERIFIED');
  
  const verifiedEvidence = OrganizationVerificationService.verifyOrganization('ORG-3', [{ status: 'VERIFIED', provider: 'ADMIN_ASSERTION' }]);
  assert.strictEqual(verifiedEvidence.status, 'VERIFIED');
  console.log('✅ PASS: Organization verification handles states cleanly');

  console.log('\n[Test 4] Placement Scam Detection (Fake Job/Internship)');
  const analysis = OpportunityAnalysisService.analyze({
    description: 'You have been selected. Pay a training fee of Rs 2000 within 30 minutes.',
    domainConsistency: 'LOOKALIKE_CANDIDATE'
  });
  assert.ok(analysis.signals.includes('PAYMENT_REQUEST_TRAINING_FEE'));
  assert.ok(analysis.signals.includes('URGENCY_SIGNAL'));
  assert.ok(analysis.signals.includes('LOOKALIKE_DOMAIN'));
  assert.strictEqual(analysis.riskScore, 90);
  console.log('✅ PASS: Accurately detected fake internship signals');

  console.log('\n[Test 5] RBAC and Tenant Isolation');
  assert.strictEqual(RbacService.canManageOrganization('ORGANIZATION_ADMIN', 'ORG-1', 'ORG-1'), true);
  assert.strictEqual(RbacService.canManageOrganization('ORGANIZATION_ADMIN', 'ORG-1', 'ORG-2'), false);
  assert.strictEqual(RbacService.canManageOrganization('USER', 'ORG-1', 'ORG-1'), false);
  assert.strictEqual(RbacService.canViewIncident('USER', 'ORG-1', 'ORG-2'), false);
  assert.strictEqual(RbacService.canViewIncident('SECURITY_ANALYST', 'ORG-1', 'ORG-99'), true);
  console.log('✅ PASS: Tenant Isolation & RBAC rules enforced');

  console.log('\n--- ScamCheck Phase 11 Tests Complete ---');
}

runTests().catch(console.error);
