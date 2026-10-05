#!/usr/bin/env node
/**
 * Test runner for the backend.
 *
 *   node scripts/run-tests.mjs            offline suites (default, used by CI)
 *   node scripts/run-tests.mjs network    needs internet (DNS / TLS / RDAP lookups)
 *   node scripts/run-tests.mjs db         needs PostgreSQL (DATABASE_URL)
 *   node scripts/run-tests.mjs live       needs a backend running on localhost:5001
 *
 * Legacy script-style tests print ✅/❌ lines; a file fails if it exits non-zero
 * OR prints a failure marker, so a swallowed assertion can no longer pass silently.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootTests = path.resolve(backendDir, '..', 'tests');
const tsx = path.join(backendDir, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');

const SUITES = {
  offline: [
    'test_risk_engine.ts',
    'test_graph.ts',
    'test_phase8.ts',
    'test_phase8_hardening.ts',
    'test_phase9.ts',
    'test_phase9_hardening.ts',
    'test_phase10_forensics.ts',
    'test_phase11_organization_protection.ts',
    'test_phase12_soc.ts',
    'test_phase13_ai.ts',
    'test_phase14_security.ts'
  ],
  network: ['test_network.ts'],
  db: ['test_database.ts'],
  live: ['test_security_inputs.ts', 'comprehensive_audit_runner.ts']
};

const FAILURE_MARKERS = /❌|\[FAIL\]|AssertionError|Unhandled|ERR_MODULE_NOT_FOUND/;
const suite = process.argv[2] || 'offline';
if (!SUITES[suite]) {
  console.error(`Unknown suite "${suite}". Use one of: ${Object.keys(SUITES).join(', ')}`);
  process.exit(2);
}

const run = (args, label) => {
  const started = Date.now();
  const res = spawnSync(tsx, args, { cwd: backendDir, encoding: 'utf8', shell: process.platform === 'win32', env: process.env });
  const output = `${res.stdout || ''}${res.stderr || ''}`;
  const failed = res.status !== 0 || (label.legacy && FAILURE_MARKERS.test(res.stdout || ''));
  console.log(`${failed ? '✖ FAIL' : '✔ PASS'}  ${label.name}  (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  if (failed) console.log(output.split('\n').map((l) => `    ${l}`).join('\n'));
  return !failed;
};

let allPassed = true;

if (suite === 'offline') {
  // Modern node:test suites live in backend/tests
  const unitFiles = fs.readdirSync(path.join(backendDir, 'tests')).filter((f) => f.endsWith('.ts')).map((f) => path.join('tests', f));
  for (const file of unitFiles) {
    allPassed = run(['--test', file], { name: file.split(path.sep).join('/'), legacy: false }) && allPassed;
  }
}

for (const file of SUITES[suite]) {
  allPassed = run([path.join(rootTests, file)], { name: `tests/${file}`, legacy: true }) && allPassed;
}

console.log(allPassed ? `\nAll ${suite} tests passed.` : `\nSome ${suite} tests failed.`);
process.exit(allPassed ? 0 : 1);
