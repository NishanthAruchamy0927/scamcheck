import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractEntities } from '../src/engine/entityExtractor.js';
import { evaluateScamPatterns } from '../src/engine/patternEngine.js';
import { DEMO_CASES } from '../src/data/demoCases.js';

const signalIds = (text: string) => evaluateScamPatterns(text, extractEntities(text)).map((s) => s.id);

describe('Account suspension threat rule (SIG-THR-17)', () => {
  it('detects the English + Tamil demo message', () => {
    const ids = signalIds('உங்கள் கணக்கு முடக்கப்படும். உடனடியாக சரிபார்க்கவும்.\nYour account is getting blocked. Please pay fee to reactivate.');
    assert.ok(ids.includes('SIG-THR-17'));
    assert.ok(ids.includes('SIG-URG-06'), 'Tamil "immediately" should count as urgency');
  });

  it('detects a Tamil-only threat', () => {
    assert.ok(signalIds('உங்கள் கணக்கு முடக்கப்படும். கட்டணம் செலுத்தவும்.').includes('SIG-THR-17'));
  });

  it('detects a Hindi threat', () => {
    assert.ok(signalIds('आपका खाता बंद हो जाएगा। तुरंत शुल्क का भुगतान करें।').includes('SIG-THR-17'));
  });

  it('does not fire on a threat with no demand, or a demand with no threat', () => {
    assert.ok(!signalIds('We closed the hiring round for this year. Thank you for applying.').includes('SIG-THR-17'));
    assert.ok(!signalIds('Please verify your email address to complete your application.').includes('SIG-THR-17'));
  });

  it('does not fire on any built-in legitimate demo', () => {
    for (const demo of DEMO_CASES.filter((d) => d.badge === 'LOW RISK')) {
      assert.ok(!signalIds(demo.content).includes('SIG-THR-17'), `false positive on ${demo.id}`);
    }
  });
});
