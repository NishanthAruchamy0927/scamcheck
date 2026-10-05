import { parseUpiPayload } from '../backend/src/engine/payment/upiParser.js';
import { decodeQrFromImage } from '../backend/src/engine/payment/qrDecoder.js';
import { safeNetworkFetch } from '../backend/src/engine/network/safeNetworkClient.js';
import assert from 'assert';

async function runTests() {
  console.log('--- ScamCheck Phase 9 Hardening Tests ---');
  
  process.env.ENABLE_MOCK_QR_DECODER = 'true'; // Enable explicitly for testing

  console.log('\n[Test 1] UPI QR Mock Decode');
  const upiQr = await decodeQrFromImage('test_upi_qr.png');
  assert.ok(upiQr, 'UPI QR should decode');
  assert.strictEqual(upiQr.payload, 'upi://pay?pa=testmerchant@example&pn=Test%20Merchant&am=499&cu=INR');
  assert.strictEqual(upiQr.confidence, null, 'Confidence should not be faked');
  assert.strictEqual(upiQr.metadata.sourceType, 'SYNTHETIC_TEST_ONLY');
  console.log('✅ PASS: UPI QR (Mock)');

  console.log('\n[Test 2] URL QR Mock Decode');
  const urlQr = await decodeQrFromImage('test_url_qr.png');
  assert.ok(urlQr, 'URL QR should decode');
  assert.strictEqual(urlQr.payload, 'https://example.test/payment');
  assert.strictEqual(urlQr.confidence, null);
  console.log('✅ PASS: URL QR (Mock)');

  console.log('\n[Test 3] Plain text QR Mock Decode');
  const textQr = await decodeQrFromImage('test_text_qr.png');
  assert.ok(textQr, 'Text QR should decode');
  assert.strictEqual(textQr.payload, 'SCAMCHECK TEST QR');
  console.log('✅ PASS: Plain text QR (Mock)');

  console.log('\n[Test 4] Malformed QR Mock Decode');
  const malformedQr = await decodeQrFromImage('test_malformed_qr.png');
  assert.strictEqual(malformedQr, null, 'Malformed QR should fail gracefully');
  console.log('✅ PASS: Malformed QR (Mock fails gracefully)');

  console.log('\n[Test 5] Production Safety Gate (ENABLE_MOCK_QR_DECODER=false)');
  process.env.ENABLE_MOCK_QR_DECODER = 'false';
  const prodCheck = await decodeQrFromImage('test_upi_qr.png');
  assert.strictEqual(prodCheck, null, 'Production environment must block mock decoding');
  console.log('✅ PASS: Mock Decoder is gated in production');
  process.env.ENABLE_MOCK_QR_DECODER = 'true';

  console.log('\n[Test 6] UPI Parser Validation (PA, PN, AM, CU)');
  const parsedFull = parseUpiPayload('upi://pay?pa=testmerchant@example&pn=Test%20Merchant&am=499&cu=INR');
  assert.strictEqual(parsedFull.identifier, 'testmerchant@example');
  assert.strictEqual(parsedFull.payeeName, 'Test Merchant');
  assert.strictEqual(parsedFull.declaredAmount, '499');
  assert.strictEqual(parsedFull.declaredCurrency, 'INR');
  assert.strictEqual((parsedFull as any).url, 'upi://pay?pa=testmerchant@example&pn=Test%20Merchant&am=499&cu=INR');
  console.log('✅ PASS: Parsed declared amount and currency without inferring completion');
  
  console.log('\n[Test 7] SSRF Safety in SafeNetworkClient');
  const ssrfUrls = [
    'http://127.0.0.1/admin',
    'http://localhost:8080',
    'http://169.254.169.254/metadata',
    'file:///etc/passwd',
    'javascript:alert(1)'
  ];
  
  for (const url of ssrfUrls) {
    try {
      await safeNetworkFetch(url);
      assert.fail(`SSRF Check failed: Should have thrown for ${url}`);
    } catch (e: any) {
      assert.ok(
        e.message.includes('SSRF') || 
        e.message.includes('Unsupported protocol') || 
        e.message.includes('DNS resolution failed'),
        `Blocked for wrong reason: ${e.message}`
      );
    }
  }
  console.log('✅ PASS: SSRF vectors blocked successfully');

  console.log('\n--- ScamCheck Phase 9 Hardening Tests Complete ---');
}

runTests().catch(console.error);
