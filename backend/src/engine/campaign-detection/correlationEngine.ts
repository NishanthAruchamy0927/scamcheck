import { dbClient } from '../../database/dbClient.js';
import { ThreatIntelAggregator } from '../threat-intelligence/provider.js';

export interface CampaignDetectionPolicy {
  timeWindowDays: number;
  minEntitiesToCorrelate: number;
  minCorrelationScore: number;
}

const DEFAULT_POLICY: CampaignDetectionPolicy = {
  timeWindowDays: 14,
  minEntitiesToCorrelate: 2, // Must share at least 2 entities (e.g. domain + phone) to automatically flag candidate
  minCorrelationScore: 50
};

export class CorrelationEngine {
  private tiAggregator = new ThreatIntelAggregator();

  /**
   * Run the campaign correlation engine against a specific investigation.
   * This should be called after an investigation is saved and entities are extracted.
   */
  async correlateInvestigation(investigationId: string): Promise<void> {
    // 1. Fetch the investigation and its entities
    const investigation = await dbClient.investigation.findUnique({
      where: { id: investigationId },
      include: {
        investigationEntities: {
          include: {
            entity: true
          }
        }
      }
    });

    if (!investigation || investigation.investigationEntities.length === 0) return;

    // Filter out common benign entities (e.g. Gmail domain) - simplistic check for now
    const benignDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'linkedin.com'];
    
    const candidateEntities = investigation.investigationEntities
      .map(ie => ie.entity)
      .filter(e => !benignDomains.includes(e.normalizedValue));

    if (candidateEntities.length === 0) return;

    // 2. Lookup Threat Intelligence for these entities
    for (const entity of candidateEntities) {
      // In background, run TI lookups and save as ThreatIndicators if malicious
      const tiResults = await this.tiAggregator.aggregate(entity.type, entity.normalizedValue);
      const isMalicious = tiResults.some(r => r.isMalicious);
      
      if (isMalicious) {
        // Upsert ThreatIndicator
        const indicator = await dbClient.threatIndicator.upsert({
          where: { entityId: entity.id },
          update: { lastSeenAt: new Date(), status: 'CORRELATED' },
          create: {
            entityId: entity.id,
            type: entity.type,
            status: 'OBSERVED',
            confidence: 80,
            source: 'TI_AGGREGATOR'
          }
        });

        // Save observations
        for (const res of tiResults) {
          for (const obs of res.observations) {
            await dbClient.threatObservation.create({
              data: {
                indicatorId: indicator.id,
                investigationId: investigation.id,
                provider: obs.provider,
                observedAt: obs.observedAt,
                confidence: obs.confidence,
                metadata: { recordId: obs.providerRecordId, sourceType: obs.sourceType }
              }
            });
          }
        }
      }
    }

    // 3. Find other investigations sharing these entities within the time window
    const timeWindowLimit = new Date(investigation.createdAt);
    timeWindowLimit.setDate(timeWindowLimit.getDate() - DEFAULT_POLICY.timeWindowDays);

    const relatedLinks = await dbClient.investigationEntity.findMany({
      where: {
        entityId: { in: candidateEntities.map(e => e.id) },
        investigationId: { not: investigation.id },
        investigation: {
          createdAt: { gte: timeWindowLimit }
        }
      },
      include: {
        investigation: true,
        entity: true
      }
    });

    // Group shared entities by investigation
    const overlapMap = new Map<string, { investigation: any, sharedEntities: any[] }>();
    
    for (const link of relatedLinks) {
      if (!overlapMap.has(link.investigationId)) {
        overlapMap.set(link.investigationId, {
          investigation: link.investigation,
          sharedEntities: []
        });
      }
      overlapMap.get(link.investigationId)!.sharedEntities.push(link.entity);
    }

    // 4. Evaluate Correlation and Group Campaigns
    const strongOverlaps = Array.from(overlapMap.entries()).filter(
      ([_, overlap]) => overlap.sharedEntities.length >= DEFAULT_POLICY.minEntitiesToCorrelate
    );

    if (strongOverlaps.length === 0) return;

    // Collect all existing campaigns linked to these overlapping investigations
    const overlappingInvestigationIds = strongOverlaps.map(([id]) => id);
    const existingCampaignLinks = await dbClient.campaignInvestigation.findMany({
      where: { investigationId: { in: overlappingInvestigationIds } },
      include: { campaign: true }
    });

    let targetCampaignId: string | null = null;
    
    // Find the best existing candidate campaign (e.g., highest correlation score or oldest)
    const candidateCampaigns = existingCampaignLinks
      .map(link => link.campaign)
      .filter(c => c.status === 'CANDIDATE' || c.status === 'UNDER_REVIEW' || c.status === 'CONFIRMED');

    if (candidateCampaigns.length > 0) {
      // Deterministic choice: pick the one with the highest correlation score, tie-break by oldest ID
      candidateCampaigns.sort((a, b) => {
        if (b.correlationScore !== a.correlationScore) return b.correlationScore - a.correlationScore;
        return a.id.localeCompare(b.id);
      });
      targetCampaignId = candidateCampaigns[0].id;
    }

    let allSharedEntities = new Map<string, any>();
    let totalScore = 0;

    for (const [otherInvId, overlap] of strongOverlaps) {
      let correlationScore = overlap.sharedEntities.length * 20;
      totalScore += correlationScore;
      overlap.sharedEntities.forEach(e => allSharedEntities.set(e.id, e));
    }

    const reason = `Shared entities across ${strongOverlaps.length} investigations.`;

    if (!targetCampaignId) {
      // Create a NEW Campaign Candidate
      const campaignName = `Campaign Candidate - ${Array.from(allSharedEntities.values())[0].normalizedValue}`;
      const campaign = await dbClient.scamCampaign.create({
        data: {
          name: campaignName,
          status: 'CANDIDATE',
          correlationScore: Math.min(totalScore, 100),
          confidence: 70,
          detectionMethod: 'SHARED_ENTITY_OVERLAP'
        }
      });
      targetCampaignId = campaign.id;
    } else {
      // Update existing campaign score
      await dbClient.scamCampaign.update({
        where: { id: targetCampaignId },
        data: { 
          correlationScore: { increment: 10 },
          lastSeenAt: new Date()
        }
      });
    }

    // Link the current investigation
    await dbClient.campaignInvestigation.upsert({
      where: {
        campaignId_investigationId: {
          campaignId: targetCampaignId,
          investigationId: investigation.id
        }
      },
      update: {},
      create: {
        campaignId: targetCampaignId,
        investigationId: investigation.id,
        confidence: 80,
        reason: reason
      }
    });

    // Link the overlapping investigations
    for (const [otherInvId] of strongOverlaps) {
      await dbClient.campaignInvestigation.upsert({
        where: {
          campaignId_investigationId: {
            campaignId: targetCampaignId,
            investigationId: otherInvId
          }
        },
        update: {},
        create: {
          campaignId: targetCampaignId,
          investigationId: otherInvId,
          confidence: 80,
          reason: reason
        }
      });
    }

    // Link all shared entities to the campaign
    for (const e of Array.from(allSharedEntities.values())) {
      await dbClient.campaignEntity.upsert({
        where: {
          campaignId_entityId: {
            campaignId: targetCampaignId,
            entityId: e.id
          }
        },
        update: {},
        create: {
          campaignId: targetCampaignId,
          entityId: e.id,
          relationship: 'SHARED_INDICATOR',
          confidence: 80
        }
      });
    }
  }
}
