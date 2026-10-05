import { ThreatIntelAggregator } from '../backend/src/engine/threat-intelligence/provider.js';
import { resolveEntity } from '../backend/src/engine/trust-graph/entityResolver.js';
import assert from 'assert';

async function runTests() {
  console.log('--- ScamCheck Phase 8 Tests ---');

  // Enable mock for testing
  process.env.ENABLE_MOCK_THREAT_INTEL = 'true';

  // Test 1: Threat Intel Aggregation (Mock)
  console.log('\n[Test 1] Threat Intelligence Lookup');
  const ti = new ThreatIntelAggregator();
  
  // Clean domain
  const res1 = await ti.aggregate('DOMAIN', 'example.com');
  assert.strictEqual(res1.length, 1);
  assert.strictEqual(res1[0].isMalicious, false);
  console.log('✅ PASS: Clean indicator correctly processed');

  // "Malicious" domain based on our mock logic (contains 'fake')
  const res2 = await ti.aggregate('DOMAIN', 'fakejobs.com');
  const mockResult = res2.find(r => r.indicator === 'fakejobs.com' && r.isMalicious);
  assert.ok(mockResult, 'Expected to find malicious threat intel response');
  assert.strictEqual(mockResult!.observations.length, 1);
  assert.strictEqual(mockResult!.observations[0].confidence, 85);
  console.log('✅ PASS: Malicious indicator correctly identified with provenance');

  console.log('\n--- Tests Complete ---');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
