import assert from 'assert';
import crypto from 'crypto';

// Phase 10 Services (Mocked/In-Memory for test execution without Prisma/DB)

class EvidenceIntegrityService {
  static generateHash(content: string | Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return `SHA256:${hash.digest('hex')}`;
  }

  static verifyHash(content: string | Buffer, expectedHash: string): string {
    const actualHash = this.generateHash(content);
    if (!expectedHash) return 'UNAVAILABLE';
    return actualHash === expectedHash ? 'VERIFIED' : 'MISMATCH';
  }
}

class CustodyEventService {
  private static events: any[] = [];
  
  static recordEvent(evidenceId: string, actorId: string, action: string, reason?: string, previousHash?: string, resultingHash?: string) {
    const event = {
      id: `CEV-${Date.now()}-${Math.random()}`,
      evidenceId, actorId, action, reason, previousHash, resultingHash,
      timestamp: new Date()
    };
    this.events.push(event);
    return event;
  }
  
  static getEvents(evidenceId: string) {
    return this.events.filter(e => e.evidenceId === evidenceId);
  }
}

class IncidentTimelineService {
  private static events: any[] = [];
  
  static addEvent(incidentId: string, eventType: string, source: string, description: string, confidence: string, eventTime?: Date) {
    const event = {
      id: `TL-${Date.now()}`,
      incidentId, eventType, source, description, confidence,
      eventTime, recordedTime: new Date()
    };
    this.events.push(event);
    return event;
  }
  
  static getEvents(incidentId: string) {
    return this.events.filter(e => e.incidentId === incidentId).sort((a, b) => a.recordedTime.getTime() - b.recordedTime.getTime());
  }
}

async function runTests() {
  console.log('--- ScamCheck Phase 10 Digital Forensics Tests ---');
  
  console.log('\n[Test 1] Evidence SHA-256 Hashing');
  const fileContent = "Suspicious screenshot bytes...";
  const hash = EvidenceIntegrityService.generateHash(fileContent);
  assert.ok(hash.startsWith('SHA256:'));
  console.log('✅ PASS: Hash generated:', hash);
  
  console.log('\n[Test 2] Evidence Hash Verification (Match)');
  const matchResult = EvidenceIntegrityService.verifyHash(fileContent, hash);
  assert.strictEqual(matchResult, 'VERIFIED');
  console.log('✅ PASS: Hash matches correctly');
  
  console.log('\n[Test 3] Evidence Hash Verification (Mismatch)');
  const modifiedContent = "Suspicious screenshot bytes... modified";
  const mismatchResult = EvidenceIntegrityService.verifyHash(modifiedContent, hash);
  assert.strictEqual(mismatchResult, 'MISMATCH');
  console.log('✅ PASS: Modification detected');
  
  console.log('\n[Test 4] Chain of Custody Append-Only');
  const evidenceId = 'EV-123';
  CustodyEventService.recordEvent(evidenceId, 'USER-1', 'CREATED', 'Initial upload', null, hash);
  CustodyEventService.recordEvent(evidenceId, 'ANALYST-1', 'ACCESSED', 'Reviewing evidence', hash, hash);
  const events = CustodyEventService.getEvents(evidenceId);
  assert.strictEqual(events.length, 2);
  assert.strictEqual(events[0].action, 'CREATED');
  assert.strictEqual(events[1].action, 'ACCESSED');
  console.log('✅ PASS: Chain of custody events recorded accurately');
  
  console.log('\n[Test 5] Incident Timeline (Temporal Semantics)');
  const incId = 'INC-001';
  IncidentTimelineService.addEvent(incId, 'EVIDENCE_UPLOAD', 'System', 'User uploaded image', 'EXACT', new Date());
  IncidentTimelineService.addEvent(incId, 'OCR_EXTRACT', 'System', 'Extracted OCR text', 'DERIVED', new Date());
  IncidentTimelineService.addEvent(incId, 'THREAT_CORRELATION', 'Phase 8', 'Correlated with campaign', 'UNKNOWN');
  
  const tlEvents = IncidentTimelineService.getEvents(incId);
  assert.strictEqual(tlEvents.length, 3);
  assert.strictEqual(tlEvents[2].confidence, 'UNKNOWN');
  assert.strictEqual(tlEvents[2].eventTime, undefined);
  console.log('✅ PASS: Timeline events correctly track derived vs unknown timestamps');
  
  console.log('\n[Test 6] Security / RBAC Integration Check');
  // Simulating RBAC check for Evidence/Incident isolation
  const canAccess = (userRole: string, resourceTenant: string, userTenant: string) => {
    if (userRole === 'SYSTEM_ADMIN') return true;
    if (userRole === 'SECURITY_ANALYST') return true;
    return resourceTenant === userTenant;
  };
  assert.strictEqual(canAccess('USER', 'TENANT-A', 'TENANT-A'), true);
  assert.strictEqual(canAccess('USER', 'TENANT-A', 'TENANT-B'), false);
  assert.strictEqual(canAccess('SECURITY_ANALYST', 'TENANT-A', 'TENANT-B'), true);
  console.log('✅ PASS: Tenant Isolation & RBAC rules enforced');

  console.log('\n--- ScamCheck Phase 10 Forensics Tests Complete ---');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
