import { resolveEntity, extractDomainFromUrlOrEmail } from '../backend/src/engine/trust-graph/entityResolver.js';
import assert from 'assert';

console.log('--- ScamCheck Graph & Entity Resolution Tests ---');

// Test 1: Email Normalization
console.log('\n[Test 1] Email Normalization');
const emailEntity = resolveEntity('EMAIL', ' HR@Example.COM ');
assert.strictEqual(emailEntity.normalizedValue, 'hr@example.com');
const emailDomain = extractDomainFromUrlOrEmail('EMAIL', emailEntity.normalizedValue);
assert.strictEqual(emailDomain, 'example.com');
console.log('✅ PASS: Email normalization and domain extraction');

// Test 2: URL Normalization
console.log('\n[Test 2] URL Normalization');
const urlEntity = resolveEntity('URL', 'https://www.example.com/jobs?id=123');
assert.strictEqual(urlEntity.normalizedValue, 'www.example.com/jobs?id=123');
const urlDomain = extractDomainFromUrlOrEmail('URL', urlEntity.normalizedValue);
assert.strictEqual(urlDomain, 'www.example.com');
console.log('✅ PASS: URL normalization and domain extraction');

// Test 3: Phone Normalization
console.log('\n[Test 3] Phone Normalization');
const phoneEntity = resolveEntity('PHONE', ' +91 (555) 123-4567 ');
assert.strictEqual(phoneEntity.normalizedValue, '+915551234567');
console.log('✅ PASS: Phone normalization');

// Test 4: Fingerprint Determinism
console.log('\n[Test 4] Fingerprint Determinism');
const fp1 = resolveEntity('EMAIL', 'test@test.com').fingerprint;
const fp2 = resolveEntity('EMAIL', 'TEST@TEST.COM').fingerprint;
assert.strictEqual(fp1, fp2);
console.log('✅ PASS: Fingerprint is deterministic for equivalent entities');

// Test 5: Organization Normalization
console.log('\n[Test 5] Organization Normalization');
const orgEntity = resolveEntity('ORGANIZATION', 'Acme Technologies Pvt. Ltd.');
// Normalization removes punctuation
assert.strictEqual(orgEntity.normalizedValue, 'acme technologies pvt ltd');
console.log('✅ PASS: Organization normalization');

console.log('\n--- Tests Complete ---');
