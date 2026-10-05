import { ThreatIntelAggregator } from '../backend/src/engine/threat-intelligence/provider.js';
import assert from 'assert';

async function runHardeningTests() {
  console.log('--- ScamCheck Phase 8 Hardening Tests ---');

  // Test 1: Mock Threat Intel Isolation
  console.log('\n[Test 1] Mock Threat Intel Isolation');
  
  // Disable mock
  process.env.ENABLE_MOCK_THREAT_INTEL = 'false';
  const ti = new ThreatIntelAggregator();
  
  const res1 = await ti.aggregate('DOMAIN', 'fakejobs.com');
  // Local provider returns false for malicious
  const malicious1 = res1.find(r => r.isMalicious);
  assert.strictEqual(malicious1, undefined, 'Mock provider should be disabled and not return malicious');
  console.log('✅ PASS: Mock provider is correctly isolated when ENABLE_MOCK_THREAT_INTEL=false');

  // Enable mock
  process.env.ENABLE_MOCK_THREAT_INTEL = 'true';
  const res2 = await ti.aggregate('DOMAIN', 'fakejobs.com');
  const malicious2 = res2.find(r => r.isMalicious);
  assert.ok(malicious2, 'Mock provider should return malicious when enabled');
  assert.strictEqual(malicious2.observations[0].provider, 'MOCK_EXTERNAL');
  assert.strictEqual(malicious2.observations[0].sourceType, 'SYNTHETIC_TEST_ONLY');
  console.log('✅ PASS: Mock provider sets clear SYNTHETIC provenance when enabled');

  console.log('\n--- Hardening Tests Complete ---');
}

runHardeningTests().catch(console.error);
