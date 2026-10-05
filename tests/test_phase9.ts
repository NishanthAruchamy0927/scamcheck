import { parseUpiPayload } from '../backend/src/engine/payment/upiParser.js';
import { decodeQrFromImage } from '../backend/src/engine/payment/qrDecoder.js';
import assert from 'assert';

async function runTests() {
  console.log('--- ScamCheck Phase 9 Tests ---');

  // Test 1: UPI Parser
  console.log('\n[Test 1] UPI Parser - Valid Formats');
  const validUrl = 'upi://pay?pa=studenthelp@example&pn=ACME%20Technologies';
  const parsed1 = parseUpiPayload(validUrl);
  assert.strictEqual(parsed1.identifier, 'studenthelp@example');
  assert.strictEqual(parsed1.payeeName, 'ACME Technologies');
  assert.strictEqual(parsed1.formatValid, true);
  console.log('✅ PASS: Valid UPI URI parsed correctly');

  const rawVpa = 'merchant_123@okicici';
  const parsed2 = parseUpiPayload(rawVpa);
  assert.strictEqual(parsed2.identifier, 'merchant_123@okicici');
  assert.strictEqual(parsed2.formatValid, true);
  console.log('✅ PASS: Raw VPA parsed and validated correctly');

  console.log('\n[Test 2] UPI Parser - Invalid Formats');
  const invalidVpa = 'not-a-valid-vpa!@bad';
  const parsed3 = parseUpiPayload(invalidVpa);
  assert.strictEqual(parsed3.formatValid, false);
  console.log('✅ PASS: Invalid VPA detected correctly');

  // Test 3: QR Decoder (Mock behavior)
  console.log('\n[Test 3] QR Decoder Degradation');
  const qr1 = await decodeQrFromImage('fake_internship_screenshot.png');
  assert.ok(qr1, 'Expected mock QR decoder to find payload for fake_internship');
  assert.strictEqual(qr1!.payload, 'upi://pay?pa=testmerchant@example&pn=Test%20Merchant&am=499&cu=INR');
  
  const qr2 = await decodeQrFromImage('normal_image.png');
  assert.strictEqual(qr2, null);
  console.log('✅ PASS: QR Decoder handles known mock paths and degrades gracefully');

  console.log('\n--- Phase 9 Tests Complete ---');
}

runTests().catch(console.error);
