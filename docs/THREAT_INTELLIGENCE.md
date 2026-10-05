# Threat Intelligence & IOC Architecture (Phase 8)

## Overview
Phase 8 introduces a formal Threat Intelligence (TI) abstraction layer for ScamCheck. This layer integrates internal observations with external threat indicators (IOCs) to evaluate the maliciousness of extracted entities (e.g., Domains, Phones, Emails).

## Indicators of Compromise (IOC)
The system represents IOCs through two primary models:
1. **ThreatIndicator**: A unique entity mapped to threat intelligence (e.g., `fakejobs.com`). It holds an overarching `status` and `confidence` score.
2. **ThreatObservation**: A specific instance or report of that indicator. A single indicator can have multiple observations from different providers or investigations over time.

## Provider Abstraction
SCAMCHECK uses a `ThreatIntelProvider` adapter interface.
- `LocalThreatIntelProvider`: Analyzes the internal ScamCheck graph for repeated appearances in confirmed campaigns.
- `MockExternalIntelProvider`: Represents external APIs (e.g., VirusTotal, URLhaus). To avoid hardcoding third-party API keys or rate limits in the MVP, this acts as a placeholder that flags domains containing terms like `scam` or `fake`.

## Provenance
Every observation strictly maintains provenance:
- `provider`: The source of the intelligence.
- `providerRecordId`: The upstream ID for the record.
- `observedAt`: When the intelligence was recorded.
- `confidence`: The upstream confidence score.

## Fallback & Graceful Degradation
If an external TI provider times out or fails (e.g., rate limiting), the aggregator logs the error and gracefully degrades to local intelligence. Investigations do not fail if threat intel is unavailable.
