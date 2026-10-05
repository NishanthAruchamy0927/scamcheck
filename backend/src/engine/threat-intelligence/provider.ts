export interface ThreatIntelObservation {
  provider: string;
  providerRecordId?: string;
  sourceURL?: string;
  sourceType: string;
  confidence: number;
  rawReference?: any;
  observedAt: Date;
}

export interface ThreatIntelResponse {
  indicator: string;
  type: string;
  isMalicious: boolean;
  observations: ThreatIntelObservation[];
}

export interface ThreatIntelProvider {
  name: string;
  lookupIndicator(type: string, value: string): Promise<ThreatIntelResponse | null>;
}

/**
 * Local Threat Intelligence Provider
 * Looks up indicators based on internal ScamCheck DB patterns.
 */
export class LocalThreatIntelProvider implements ThreatIntelProvider {
  name = 'SCAMCHECK_LOCAL';

  async lookupIndicator(type: string, value: string): Promise<ThreatIntelResponse | null> {
    // In a real system, this would query the DB for the entity
    // and count its presence in confirmed campaigns or high-risk investigations.
    return {
      indicator: value,
      type,
      isMalicious: false, // We don't automatically mark malicious just because it exists
      observations: []
    };
  }
}

/**
 * Mock External Threat Intelligence Provider
 * Simulates calling an external threat intel API (e.g. VirusTotal, AlienVault)
 */
export class MockExternalIntelProvider implements ThreatIntelProvider {
  name = 'MOCK_EXTERNAL_TI';

  async lookupIndicator(type: string, value: string): Promise<ThreatIntelResponse | null> {
    if (process.env.ENABLE_MOCK_THREAT_INTEL !== 'true') {
      return null;
    }

    // Mock response for testing
    if (value.includes('scam') || value.includes('fake')) {
      return {
        indicator: value,
        type,
        isMalicious: true,
        observations: [
          {
            provider: 'MOCK_EXTERNAL',
            providerRecordId: 'MOCK-SYNTHETIC-1234',
            sourceType: 'SYNTHETIC_TEST_ONLY',
            confidence: 85,
            rawReference: { environment: 'TEST/DEVELOPMENT' },
            observedAt: new Date()
          }
        ]
      };
    }
    return null;
  }
}

export class ThreatIntelAggregator {
  private providers: ThreatIntelProvider[] = [];

  constructor() {
    this.providers.push(new LocalThreatIntelProvider());
    this.providers.push(new MockExternalIntelProvider());
  }

  async aggregate(type: string, value: string): Promise<ThreatIntelResponse[]> {
    const results: ThreatIntelResponse[] = [];
    for (const provider of this.providers) {
      try {
        const res = await provider.lookupIndicator(type, value);
        if (res) {
          results.push(res);
        }
      } catch (err) {
        console.error(`[ThreatIntel] Provider ${provider.name} failed:`, err);
        // Continue gracefully on failure
      }
    }
    return results;
  }
}
