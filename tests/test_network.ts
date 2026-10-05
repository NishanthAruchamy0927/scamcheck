import { safeNetworkFetch } from '../backend/src/engine/network/safeNetworkClient.js';
import { verifyDns, verifyTls, verifyEmailInfrastructure, verifyRdap } from '../backend/src/engine/network/verificationProviders.js';

async function runTests() {
  console.log('--- ScamCheck Network Security Regression Tests ---');
  
  // 1. SSRF Protection - Metadata Service
  console.log('\n[Test 1] SSRF - AWS Metadata Service (169.254.169.254)');
  try {
    await safeNetworkFetch('http://169.254.169.254/latest/meta-data/', { timeoutMs: 2000 });
    console.error('❌ FAIL: Allowed connection to AWS metadata IP');
  } catch (err: any) {
    if (err.message.includes('private/reserved')) {
      console.log('✅ PASS: Blocked AWS metadata IP properly');
    } else {
      console.log(`❌ FAIL: Unexpected error: ${err.message}`);
    }
  }

  // 2. SSRF Protection - Localhost
  console.log('\n[Test 2] SSRF - Localhost via IPv4 (127.0.0.1)');
  try {
    await safeNetworkFetch('http://127.0.0.1:5432', { timeoutMs: 2000 });
    console.error('❌ FAIL: Allowed connection to localhost');
  } catch (err: any) {
    if (err.message.includes('private/reserved') || err.message.includes('Unsupported protocol') || err.message.includes('DNS resolution failed')) {
      console.log('✅ PASS: Blocked localhost properly');
    } else {
      console.log(`❌ FAIL: Unexpected error: ${err.message}`);
    }
  }

  // 3. SSRF Protection - DNS Rebinding Simulation (using spoofed local domain if possible, or we just trust the unit tests)
  console.log('\n[Test 3] Safe Fetch - Public Domain (example.com)');
  try {
    const res = await safeNetworkFetch('http://example.com', { timeoutMs: 3000 });
    if (res.statusCode === 200) {
      console.log('✅ PASS: Successfully fetched safe public domain');
    } else {
      console.error(`❌ FAIL: Unexpected status code: ${res.statusCode}`);
    }
  } catch (err: any) {
    console.error(`❌ FAIL: Failed to fetch safe domain: ${err.message}`);
  }

  // 4. Verification Adapters - DNS
  console.log('\n[Test 4] Verification Adapters - DNS (google.com)');
  const dnsRes = await verifyDns('google.com');
  if (dnsRes.status === 'VERIFIED') {
    console.log('✅ PASS: Successfully resolved DNS for google.com');
  } else {
    console.error('❌ FAIL: Failed to resolve DNS for google.com');
  }

  // 5. Verification Adapters - TLS
  console.log('\n[Test 5] Verification Adapters - TLS (google.com)');
  const tlsRes = await verifyTls('google.com');
  if (tlsRes.status === 'VERIFIED') {
    console.log(`✅ PASS: Successfully verified TLS for google.com. Issuer: ${tlsRes.issuer}`);
  } else {
    console.error('❌ FAIL: Failed to verify TLS for google.com');
  }

  // 6. Verification Adapters - Email Auth
  console.log('\n[Test 6] Verification Adapters - Email Auth (google.com)');
  const emailRes = await verifyEmailInfrastructure('google.com');
  if (emailRes.hasMx && emailRes.spfStatus === 'SPF_PRESENT') {
    console.log('✅ PASS: Successfully verified Email Infrastructure for google.com');
  } else {
    console.error('❌ FAIL: Failed to verify Email Infrastructure for google.com');
  }

  // 7. Verification Adapters - RDAP
  console.log('\n[Test 7] Verification Adapters - RDAP (google.com)');
  const rdapRes = await verifyRdap('google.com');
  if (rdapRes.status === 'AVAILABLE') {
    console.log(`✅ PASS: Successfully verified RDAP for google.com. Registered: ${rdapRes.registrationDate}`);
  } else {
    console.error('❌ FAIL: Failed to verify RDAP for google.com');
  }

  console.log('\n--- Tests Complete ---');
}

runTests();
