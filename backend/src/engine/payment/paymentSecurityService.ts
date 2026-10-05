import { dbClient } from '../../database/dbClient.js';
import { parseUpiPayload } from './upiParser.js';

export class PaymentSecurityService {
  /**
   * Evaluate payment risk based on format, graph correlation, and verification evidence.
   */
  async evaluatePaymentDestination(entityId: string): Promise<any> {
    const entity = await dbClient.entity.findUnique({
      where: { id: entityId },
      include: {
        investigations: { include: { investigation: true } },
        campaigns: { include: { campaign: true } },
        threatIndicators: { include: { observations: true } }
      }
    });

    if (!entity) return null;

    let formatStatus = 'UNKNOWN';
    let riskSignals: string[] = [];
    let trustSignals: string[] = [];
    let riskScore = 0;
    
    // 1. Format Validity
    if (entity.type === 'UPI' || entity.type === 'UPI_URL') {
      const parsed = parseUpiPayload(entity.rawValue);
      formatStatus = parsed.formatValid ? 'VALID' : 'INVALID';
      
      if (!parsed.formatValid) {
        riskSignals.push('Invalid UPI syntax format');
        riskScore += 20;
      }
    } else if (entity.type === 'PAYMENT_URL') {
      try {
        new URL(entity.rawValue);
        formatStatus = 'VALID';
      } catch {
        formatStatus = 'INVALID';
      }
    }

    // 2. Correlation & Threat Intel
    if (entity.campaigns.length > 0) {
      riskSignals.push(`Linked to ${entity.campaigns.length} scam campaign(s)`);
      riskScore += 50;
    }

    if (entity.threatIndicators.some(ti => ti.status === 'CONFIRMED' || ti.status === 'CORRELATED')) {
      riskSignals.push('Associated with confirmed threat intelligence');
      riskScore += 40;
    }

    if (entity.investigations.length > 1) {
      riskSignals.push(`Reused across ${entity.investigations.length} distinct investigations`);
      // Reuse isn't immediately fraud, but if linked to scams, it's risky
      riskScore += 10;
    }

    if (riskScore === 0) {
      trustSignals.push('No suspicious correlations found');
    }

    // Map riskScore to categories
    let riskCategory = 'UNKNOWN';
    if (riskScore >= 60) riskCategory = 'HIGH';
    else if (riskScore >= 30) riskCategory = 'ELEVATED';
    else if (riskScore > 0) riskCategory = 'MODERATE';
    else riskCategory = 'LOW';

    let confidence = Math.min(100, (entity.investigations.length * 10) + (entity.threatIndicators.length * 20) + 10);

    const assessment = await dbClient.paymentAssessment.upsert({
      where: { entityId: entity.id },
      update: {
        formatStatus,
        verificationStatus: 'UNVERIFIED', // Phase 9 doesn't explicitly verify ownership unless mocked
        riskSignals: riskSignals as any,
        trustSignals: trustSignals as any,
        confidence
      },
      create: {
        entityId: entity.id,
        formatStatus,
        verificationStatus: 'UNVERIFIED',
        riskSignals: riskSignals as any,
        trustSignals: trustSignals as any,
        confidence
      }
    });

    return {
      assessment,
      riskCategory,
      evidence: {
        investigationCount: entity.investigations.length,
        campaignCount: entity.campaigns.length,
        threatIndicatorCount: entity.threatIndicators.length
      }
    };
  }
}
