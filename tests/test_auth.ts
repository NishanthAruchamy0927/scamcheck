import fs from 'fs';
import path from 'path';

export const runAuthTests = async () => {
  console.log('--- RUNNING AUTHENTICATION & RBAC TESTS ---');
  // I will write actual endpoints test after testing server locally
}

if (import.meta.url.startsWith('file:') && process.argv[1] === new URL(import.meta.url).pathname) {
  runAuthTests();
}
