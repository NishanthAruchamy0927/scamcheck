# UPI Intelligence Architecture

## Overview
UPI (Unified Payments Interface) is the dominant real-time payment system in India and a frequent vector for scams. Phase 9 implements targeted intelligence to decode, normalize, and correlate UPI endpoints without prematurely labeling them as malicious.

## Extraction and Normalization
1. **Format Validation (`upiParser.ts`)**: 
   - Supports raw VPAs (`name@bank`).
   - Supports `upi://pay?` URIs.
   - Extracts exact parameters (`pa`, `pn`, `mc`, `tr`) accurately.
2. **Canonicalization**:
   - The primary identifier (`pa`) is extracted and converted to lowercase.
   - It is stored as the `rawValue` in the Trust Graph, mapped to the `UPI` entity type.

## Correlation
Once a UPI entity is added to the graph, it is evaluated by the `PaymentSecurityService`:
- It checks if the UPI was seen in previous investigations.
- It checks if the UPI intersects with known Scam Campaigns (Phase 8).
- It queries Threat Intelligence indicators.

## Intelligence Outcomes
- **Low Risk**: Unknown identifier, standard VPA format, no history. (Marked UNVERIFIED)
- **Elevated Risk**: Identifier reused across multiple unrelated investigations, no confirmed scams.
- **High Risk**: Direct correlation with a confirmed scam campaign or external threat intel observation.

By treating the identifier as an independent entity in the graph, we unlock cross-investigation correlation capabilities.
