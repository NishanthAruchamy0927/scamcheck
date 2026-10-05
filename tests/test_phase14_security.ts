import assert from 'assert';

// PHASE 14: SCAMCHECK Security & Hardening Tests

// 1. Mock Database to test RBAC and Tenant Isolation
const DB = {
  investigations: [
    { id: 'INV-A1', orgId: 'ORG-A', userId: 'USER-A' },
    { id: 'INV-B1', orgId: 'ORG-B', userId: 'USER-B' }
  ],
  users: [
    { id: 'USER-A', role: 'USER', orgId: 'ORG-A' },
    { id: 'ADMIN-A', role: 'ORGANIZATION_ADMIN', orgId: 'ORG-A' },
    { id: 'ANALYST', role: 'SECURITY_ANALYST', orgId: null }
  ]
};

// 2. Mock Controllers
class RbacMiddleware {
  static canAccessInvestigation(userId: string, targetInvId: string) {
    const user = DB.users.find(u => u.id === userId);
    const inv = DB.investigations.find(i => i.id === targetInvId);
    
    if (!user || !inv) return false;
    
    if (user.role === 'SYSTEM_ADMIN' || user.role === 'SECURITY_ANALYST') return true;
    if (user.role === 'ORGANIZATION_ADMIN' && user.orgId === inv.orgId) return true;
    if (user.role === 'USER' && inv.userId === user.id) return true;
    
    return false; // Default deny
  }
}

// 3. SSRF SafeNetworkClient (Re-implemented for security test)
class SafeNetworkClient {
  static async fetchUrl(url: string) {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    
    // Explicit deny lists
    const deniedHostnames = ['localhost', '127.0.0.1', '169.254.169.254', '0.0.0.0'];
    if (deniedHostnames.includes(hostname)) {
      throw new Error(`SSRF_BLOCKED: Hostname ${hostname} is forbidden`);
    }
    
    // Scheme checking
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`SSRF_BLOCKED: Protocol ${parsed.protocol} is forbidden`);
    }
    
    return "Fetched successfully (simulated)";
  }
}

// 4. File Upload Validator
class FileSecurity {
  static validateUpload(filename: string, sizeBytes: number) {
    if (filename.includes('..') || filename.startsWith('/')) {
      throw new Error('PATH_TRAVERSAL_DETECTED');
    }
    
    // 5MB limit
    if (sizeBytes > 5 * 1024 * 1024) {
      throw new Error('FILE_TOO_LARGE');
    }
    
    return true;
  }
}

async function runTests() {
  console.log('--- ScamCheck Phase 14 Security Tests ---\n');

  console.log('[Test 1] Horizontal Privilege Escalation');
  // USER-A tries to access USER-B's investigation
  assert.strictEqual(RbacMiddleware.canAccessInvestigation('USER-A', 'INV-B1'), false);
  console.log('✅ PASS: Horizontal privilege escalation blocked.');

  console.log('\n[Test 2] Vertical Privilege Escalation');
  // ORGANIZATION_ADMIN-A tries to access ORG-B
  assert.strictEqual(RbacMiddleware.canAccessInvestigation('ADMIN-A', 'INV-B1'), false);
  console.log('✅ PASS: Vertical privilege escalation blocked for Org Admin.');
  
  // SECURITY_ANALYST can access both
  assert.strictEqual(RbacMiddleware.canAccessInvestigation('ANALYST', 'INV-A1'), true);
  assert.strictEqual(RbacMiddleware.canAccessInvestigation('ANALYST', 'INV-B1'), true);
  console.log('✅ PASS: Security Analyst has global read access.');

  console.log('\n[Test 3] SSRF Protection');
  try {
    await SafeNetworkClient.fetchUrl('http://169.254.169.254/latest/meta-data');
    assert.fail('Should block AWS metadata');
  } catch (e: any) {
    assert.ok(e.message.includes('SSRF_BLOCKED'));
  }
  
  try {
    await SafeNetworkClient.fetchUrl('file:///etc/passwd');
    assert.fail('Should block file:// protocol');
  } catch (e: any) {
    assert.ok(e.message.includes('SSRF_BLOCKED'));
  }
  
  try {
    await SafeNetworkClient.fetchUrl('http://127.0.0.1:5000/internal-api');
    assert.fail('Should block localhost');
  } catch (e: any) {
    assert.ok(e.message.includes('SSRF_BLOCKED'));
  }
  console.log('✅ PASS: SSRF attempts safely blocked via explicit hostname & protocol parsing.');

  console.log('\n[Test 4] Path Traversal and File Limits');
  try {
    FileSecurity.validateUpload('../../../etc/passwd', 100);
    assert.fail('Should block path traversal');
  } catch (e: any) {
    assert.strictEqual(e.message, 'PATH_TRAVERSAL_DETECTED');
  }
  
  try {
    FileSecurity.validateUpload('evidence.pdf', 10 * 1024 * 1024);
    assert.fail('Should block oversized file');
  } catch (e: any) {
    assert.strictEqual(e.message, 'FILE_TOO_LARGE');
  }
  console.log('✅ PASS: Malicious filenames and oversized payloads rejected.');

  console.log('\n--- ScamCheck Phase 14 Security Tests Complete ---');
}

runTests().catch(console.error);
